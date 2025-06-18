
import React, { useState, useEffect, useCallback } from 'react';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';
import { askPickleballGuru } from './services/geminiService';
import { IconButton } from './components/IconButton';
import { AnswerCard } from './components/AnswerCard';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ApiKeyWarning } from './components/ApiKeyWarning';
import { ProjectIDWarning } from './components/ProjectIDWarning';
import { MicrophoneIcon } from './assets/MicrophoneIcon';
import { StopIcon } from './assets/StopIcon';
import { PickleballIcon } from './assets/PickleballIcon';
import { SoundOnIcon } from './assets/SoundOnIcon';
import { ProcessedGroundingSource } from './types';

// Check for API Key at the module level, as process.env is build-time
const API_KEY_PRESENT: boolean = !!process.env.API_KEY;
const PROJECT_ID_PLACEHOLDER = "YOUR_GOOGLE_CLOUD_PROJECT_ID_OR_NUMBER";
const PROJECT_ID_CONFIGURED: boolean = process.env.GOOGLE_CLOUD_PROJECT_ID !== PROJECT_ID_PLACEHOLDER && !!process.env.GOOGLE_CLOUD_PROJECT_ID;

const App: React.FC = () => {
  const [question, setQuestion] = useState<string>('');
  const [answer, setAnswer] = useState<string>('');
  const [groundingSources, setGroundingSources] = useState<ProcessedGroundingSource[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    error: speechError,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  const { speak, isSpeaking, cancelSpeech, browserSupportsSpeechSynthesis } = useSpeechSynthesis();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (speechError) {
      setError(`Speech recognition error: ${speechError}`);
    }
  }, [speechError]);

  const processTranscript = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setQuestion(text);
    setAnswer('');
    setGroundingSources([]);
    setError(null);
    setIsLoading(true);

    if (!API_KEY_PRESENT) {
      setError("Gemini API key is not configured. Please set the API_KEY environment variable.");
      setIsLoading(false);
      return;
    }
     if (!PROJECT_ID_CONFIGURED) {
       console.warn(`Google Cloud Project ID is not configured or is using a placeholder. Grounding may not work as expected. Please set the GOOGLE_CLOUD_PROJECT_ID environment variable.`);
     }

    try {
      const result = await askPickleballGuru(text, process.env.API_KEY!, process.env.GOOGLE_CLOUD_PROJECT_ID || PROJECT_ID_PLACEHOLDER);
      setAnswer(result.text);
      if (result.groundingSources && result.groundingSources.length > 0) {
        setGroundingSources(result.groundingSources);
      }
      if (result.text && browserSupportsSpeechSynthesis) {
        speak(result.text);
      }
    } catch (e: any) {
      console.error("Error fetching answer from Gemini:", e);
      setError(e.message || "Failed to get an answer from the Pickleball Guru.");
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speak, browserSupportsSpeechSynthesis]); // Dependencies for processTranscript

  useEffect(() => {
    if (transcript && !isListening) { // Process transcript when listening stops and transcript is available
      processTranscript(transcript);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript, isListening]); // processTranscript is memoized

  const handleToggleListening = () => {
    setError(null);
    if (isSpeaking) {
      cancelSpeech();
    }
    if (isListening) {
      stopListening();
    } else {
      setQuestion(''); // Clear previous question
      setAnswer(''); // Clear previous answer
      setGroundingSources([]);
      startListening();
    }
  };
  
  const handleSpeakAnswer = () => {
    if (answer && !isSpeaking) {
      speak(answer);
    } else if (isSpeaking) {
      cancelSpeech();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 text-white selection:bg-yellow-300 selection:text-emerald-900">
      <header className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3">
          <PickleballIcon className="w-24 h-24" /> {/* Icon's className simplified */}
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Pickleball Rules Guru</h1>
        </div>
        <p className="mt-3 text-lg text-green-100">Ask me any question about pickleball rules!</p>
      </header>

      {!API_KEY_PRESENT && <ApiKeyWarning />}
      {!PROJECT_ID_CONFIGURED && API_KEY_PRESENT && <ProjectIDWarning placeholder={PROJECT_ID_PLACEHOLDER} />}

      <main className="w-full max-w-2xl bg-white/90 backdrop-blur-md shadow-2xl rounded-xl p-6 md:p-8 text-gray-800">
        {!browserSupportsSpeechRecognition && (
          <p className="text-red-600 bg-red-100 p-3 rounded-md mb-4 text-sm">Your browser does not support speech recognition. Please type your question or try a different browser.</p>
        )}
        {!browserSupportsSpeechSynthesis && (
          <p className="text-orange-600 bg-orange-100 p-3 rounded-md mb-4 text-sm">Your browser does not support speech synthesis. Answers will be text-only.</p>
        )}

        <div className="flex flex-col items-center space-y-6">
          <IconButton
            onClick={handleToggleListening}
            disabled={!browserSupportsSpeechRecognition || !API_KEY_PRESENT}
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

          {isListening && <p className="text-emerald-600 animate-pulse">Listening...</p>}
          
          {isLoading && <LoadingSpinner />}
          
          {error && <p className="text-red-600 bg-red-100 p-3 rounded-md w-full text-sm">{error}</p>}

          {(question || transcript || answer) && ( // Ensure card shows if there's a transcript even before processing
            <AnswerCard 
              question={question || transcript} 
              answer={answer} 
              groundingSources={groundingSources}
              isMobile={isMobile} 
            />
          )}

          {answer && browserSupportsSpeechSynthesis && !isLoading && (
            <IconButton
              onClick={handleSpeakAnswer}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-full focus:ring-emerald-400"
              aria-label={isSpeaking ? "Stop speaking" : "Speak answer"}
            >
              <SoundOnIcon className="w-5 h-5 mr-2" />
              {isSpeaking ? 'Stop Speaking' : 'Speak Answer'}
            </IconButton>
          )}
        </div>
      </main>

      <footer className="mt-12 text-center text-sm text-green-100">
        <p>&copy; {new Date().getFullYear()} Pickleball Rules Guru. Powered by Gemini.</p>
         <p className="mt-1 text-xs">Remember to configure API_KEY and GOOGLE_CLOUD_PROJECT_ID environment variables.</p>
      </footer>
    </div>
  );
};

export default App;