import React, { useEffect, useState } from 'react';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'error' | 'warn';
  message: string;
  details?: any;
}

export const DebugLog: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    // Create a custom console logger that captures logs
    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn
    };

    const addLog = (level: LogEntry['level'], ...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');

      const entry: LogEntry = {
        timestamp: new Date().toLocaleTimeString(),
        level,
        message,
        details: args.length > 1 ? args : undefined
      };

      setLogs(prev => [...prev.slice(-50), entry]); // Keep last 50 logs
      
      // Still call the original console method
      if (level === 'info') originalConsole.log(...args);
      else if (level === 'error') originalConsole.error(...args);
      else if (level === 'warn') originalConsole.warn(...args);
    };

    // Override console methods
    console.log = (...args: any[]) => addLog('info', ...args);
    console.error = (...args: any[]) => addLog('error', ...args);
    console.warn = (...args: any[]) => addLog('warn', ...args);

    // Log initial message
    console.log('Debug logging initialized');

    // Cleanup: restore original console methods
    return () => {
      console.log = originalConsole.log;
      console.error = originalConsole.error;
      console.warn = originalConsole.warn;
    };
  }, []);

  const clearLogs = () => {
    setLogs([]);
    console.log('Debug logs cleared');
  };

  const testTTS = async () => {
    console.log('Testing TTS endpoint...');
    try {
      const response = await fetch('/api/tts-test');
      const data = await response.json();
      console.log('TTS Test Result:', data);
    } catch (error) {
      console.error('TTS Test Error:', error);
    }
  };

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return '#ff6b6b';
      case 'warn': return '#ffd93d';
      case 'info': return '#4ecdc4';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: isMinimized ? '10px' : '15px',
      borderRadius: '8px',
      maxWidth: isMinimized ? 'auto' : '400px',
      maxHeight: isMinimized ? 'auto' : '300px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999,
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: isMinimized ? 0 : '10px',
        gap: '10px'
      }}>
        <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
          Debug Log {!isMinimized && `(${logs.length})`}
        </span>
        <div style={{ display: 'flex', gap: '5px' }}>
          {!isMinimized && (
            <>
              <button
                onClick={testTTS}
                style={{
                  padding: '2px 8px',
                  fontSize: '11px',
                  backgroundColor: '#4ecdc4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Test TTS
              </button>
              <button
                onClick={clearLogs}
                style={{
                  padding: '2px 8px',
                  fontSize: '11px',
                  backgroundColor: '#ff6b6b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Clear
              </button>
            </>
          )}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            style={{
              padding: '2px 8px',
              fontSize: '11px',
              backgroundColor: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {isMinimized ? '▲' : '▼'}
          </button>
        </div>
      </div>
      
      {!isMinimized && (
        <div style={{
          overflowY: 'auto',
          maxHeight: '250px',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          padding: '10px',
          borderRadius: '4px',
          marginTop: '5px'
        }}>
          {logs.length === 0 ? (
            <div style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
              No logs yet. Interact with the voice assistant to see logs.
            </div>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                style={{
                  marginBottom: '8px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  paddingBottom: '8px'
                }}
              >
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#666', fontSize: '10px', minWidth: '60px' }}>
                    {log.timestamp}
                  </span>
                  <span
                    style={{
                      color: getLevelColor(log.level),
                      fontWeight: 'bold',
                      minWidth: '40px',
                      fontSize: '10px'
                    }}
                  >
                    [{log.level.toUpperCase()}]
                  </span>
                  <span style={{ 
                    flex: 1, 
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {log.message}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};