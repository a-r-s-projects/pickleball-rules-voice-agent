
import { useState, useEffect, useCallback, useRef } from 'react';

// --- Start of TypeScript definitions for Web Speech API ---
interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

// This interface is already locally defined but enhanced for clarity with standard properties.
// User-defined SpeechRecognitionEvent - ensure it matches the actual event structure
interface CustomSpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
  // Other potential properties: emma, interpretation, etc.
}

// User-defined SpeechRecognitionErrorEvent - ensure it matches the actual event structure
interface CustomSpeechRecognitionErrorEvent extends Event { // Standard is SpeechRecognitionErrorEvent which extends ErrorEvent
  error: string; // SpeechRecognitionErrorCode e.g. 'no-speech', 'audio-capture', 'not-allowed', 'network', etc.
  message?: string; // Optional descriptive message
}


interface SpeechGrammar {
  src: string;
  weight: number;
}

interface SpeechGrammarList {
  readonly length: number;
  item(index: number): SpeechGrammar;
  addFromString(string: string, weight?: number): void;
  addFromURI(src: string, weight?: number): void;
  [index: number]: SpeechGrammar;
}

// Main SpeechRecognition interface (using ISpeechRecognition to avoid potential global conflicts)
interface ISpeechRecognition extends EventTarget {
  grammars: SpeechGrammarList;
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  serviceURI?: string; // Deprecated in some specs, but might exist

  onaudiostart: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onaudioend: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onend: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: ISpeechRecognition, ev: CustomSpeechRecognitionErrorEvent) => any) | null;
  onnomatch: ((this: ISpeechRecognition, ev: CustomSpeechRecognitionEvent) => any) | null;
  onresult: ((this: ISpeechRecognition, ev: CustomSpeechRecognitionEvent) => any) | null;
  onsoundstart: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onsoundend: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: ISpeechRecognition, ev: Event) => any) | null;

  abort(): void;
  start(): void;
  stop(): void;
}

// Constructor type for SpeechRecognition
interface SpeechRecognitionStatic {
  new(): ISpeechRecognition;
  prototype: ISpeechRecognition;
}

// Augment the global Window interface
declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionStatic;
    webkitSpeechRecognition?: SpeechRecognitionStatic; // Often an alias for SpeechRecognition
  }
}
// --- End of TypeScript definitions ---


interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  error: string | null;
  browserSupportsSpeechRecognition: boolean;
}

export const useSpeechRecognition = (): SpeechRecognitionHook => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  const browserSupportsSpeechRecognition = !!(
      typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition)
    );

  useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    // Ensure SpeechRecognitionAPI is not undefined before using it as a constructor
    if (!SpeechRecognitionAPI) {
        setError("Speech recognition API is not available on window object.");
        return;
    }

    recognitionRef.current = new SpeechRecognitionAPI();
    const recognition = recognitionRef.current;

    recognition.continuous = false; 
    recognition.interimResults = false; 
    recognition.lang = 'en-US';

    recognition.onresult = (event: Event) => {
      // Cast to the more specific event type defined above
      const speechEvent = event as CustomSpeechRecognitionEvent;
      let currentTranscript = '';
      for (let i = speechEvent.resultIndex; i < speechEvent.results.length; ++i) {
        if (speechEvent.results[i] && speechEvent.results[i][0]) {
             currentTranscript += speechEvent.results[i][0].transcript;
        }
      }
      setTranscript(currentTranscript);
      setError(null); 
    };

    recognition.onerror = (event: Event) => {
      // Cast to the more specific error event type
      const errorEvent = event as CustomSpeechRecognitionErrorEvent;
      console.error('Speech recognition error:', errorEvent.error, errorEvent.message);
      let errorMessage = `Speech recognition error: ${errorEvent.error}.`;
      if (errorEvent.error === 'no-speech') {
        errorMessage = "No speech was detected. Please try again.";
      } else if (errorEvent.error === 'audio-capture') {
        errorMessage = "Audio capture failed. Ensure microphone is enabled and working.";
      } else if (errorEvent.error === 'not-allowed') {
        errorMessage = "Microphone access denied. Please allow microphone permission in your browser settings.";
      }
      setError(errorMessage);
      setIsListening(false); 
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        // Nullify handlers to prevent memory leaks or errors after unmount
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onaudiostart = null;
        recognitionRef.current.onaudioend = null;
        recognitionRef.current.onnomatch = null;
        recognitionRef.current.onsoundstart = null;
        recognitionRef.current.onsoundend = null;
        recognitionRef.current.onspeechstart = null;
        recognitionRef.current.onspeechend = null;
        recognitionRef.current.onstart = null;
      }
    };
  }, [browserSupportsSpeechRecognition]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        setTranscript(''); 
        setError(null); 
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e: any) {
        console.error("Error starting speech recognition:", e);
        setError(`Could not start listening: ${e.message}`);
        setIsListening(false);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e: any) {
        console.error("Error stopping speech recognition:", e);
        // Usually, .stop() doesn't throw errors if called when not active, but good practice to be safe
      } finally {
        setIsListening(false); // Ensure listening state is reset
      }
    }
  }, [isListening]);

  return { isListening, transcript, startListening, stopListening, error, browserSupportsSpeechRecognition };
};
