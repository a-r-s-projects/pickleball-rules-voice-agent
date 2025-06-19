import React, { useState, useEffect } from 'react';
import { useVoiceAssistant } from './hooks/useVoiceAssistant';
import { IconButton } from './components/IconButton';
import { AnswerCard } from './components/AnswerCard';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ApiKeyWarning } from './components/ApiKeyWarning';
import { MicrophoneIcon } from './assets/MicrophoneIcon';
import { StopIcon } from './assets/StopIcon';
import { PickleballIcon } from './assets/PickleballIcon';

// Check for API Key at the module level
const API_KEY_PRESENT: boolean = !!import.meta.env.VITE_GEMINI_API_KEY;

const App: React.FC = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Use the new Voice Assistant hook
  const {
    isConnected,
    isListening,
    transcript,
    response,
    error: assistantError,
    startSession,
    endSession,
    startListening,
    stopListening
  } = useVoiceAssistant(import.meta.env.VITE_GEMINI_API_KEY || '');

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-start session when API key is available
  useEffect(() => {
    if (API_KEY_PRESENT && !isConnected && !assistantError) {
      startSession();
    }
  }, [API_KEY_PRESENT, isConnected, assistantError, startSession]);

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleReconnect = () => {
    endSession();
    setTimeout(() => startSession(), 1000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 text-white selection:bg-yellow-300 selection:text-emerald-900">
      <header className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3">
          <PickleballIcon className="w-24 h-24" />
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Pickleball Rules Guru</h1>
        </div>
        <p className="mt-3 text-lg text-green-100">Ask me any question about pickleball rules!</p>
        <p className="mt-1 text-sm text-green-200">
          {isConnected ? '🟢 Voice Assistant Ready' : '🔴 Connecting...'}
        </p>
      </header>

      {!API_KEY_PRESENT && <ApiKeyWarning />}

      <main className="w-full max-w-2xl bg-white/90 backdrop-blur-md shadow-2xl rounded-xl p-6 md:p-8 text-gray-800">
        
        {assistantError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md">
            <p className="text-red-700 text-sm">{assistantError}</p>
            <button 
              onClick={handleReconnect}
              className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
            >
              Reconnect
            </button>
          </div>
        )}

        <div className="flex flex-col items-center space-y-6">
          <IconButton
            onClick={handleToggleListening}
            disabled={!isConnected || !API_KEY_PRESENT}
            className={`px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-opacity-50
              ${isListening 
                ? 'bg-red-500 hover:bg-red-600 focus:ring-red-400 text-white' 
                : 'bg-yellow-400 hover:bg-yellow-500 focus:ring-yellow-300 text-emerald-900'}
              disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:hover:scale-100`}
            aria-pressed={isListening}
            aria-label={isListening ? "Stop listening" : "Start listening"}
          >
            {isListening ? (
              <> <StopIcon className="w-6 h-6 mr-2" /> Stop Listening </>
            ) : (
              <> <MicrophoneIcon className="w-6 h-6 mr-2" /> Start Listening </>
            )}
          </IconButton>

          {isListening && <p className="text-emerald-600 animate-pulse">Listening for your question...</p>}
          
          {!isConnected && API_KEY_PRESENT && <LoadingSpinner />}

          {(transcript || response) && (
            <AnswerCard 
              question={transcript || "Processing your question..."} 
              answer={response || "Thinking..."}
              groundingSources={[]} // No grounding sources needed
              isMobile={isMobile} 
            />
          )}

        </div>
      </main>

      <footer className="mt-12 text-center text-sm text-green-100">
        <p>&copy; {new Date().getFullYear()} Pickleball Rules Guru. Powered by Gemini AI.</p>
        <p className="mt-1 text-xs">Voice-powered assistant for comprehensive pickleball knowledge.</p>
      </footer>
    </div>
  );
};

export default App;