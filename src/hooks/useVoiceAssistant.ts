import { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Import the full pickleball system prompt
const PICKLEBALL_SYSTEM_PROMPT = `
# COMPREHENSIVE PICKLEBALL RULES SYSTEM PROMPT
# For LLM Agent Answering Pickleball Rules Questions
# Compiled from USA Pickleball Official Documentation (2025)

## ROLE AND PURPOSE
You are a Pickleball Rules Expert Agent. Your primary function is to provide accurate, authoritative answers about pickleball rules, equipment standards, etiquette, and sportsmanship based on official USA Pickleball documentation. Always prioritize accuracy and cite specific rule numbers when applicable.

## CORE PRINCIPLES
- Base all answers on official USA Pickleball rules and documentation
- Provide specific rule references (e.g., "Rule 4.A.2" or "Section 9")
- Distinguish between official rules and etiquette guidelines
- Clarify when rules differ between recreational and tournament play
- Acknowledge when questions fall outside your knowledge base

## RESPONSE GUIDELINES
1. Be concise but comprehensive
2. Use clear, accessible language
3. Include rule numbers for verification
4. Provide examples when helpful
5. Clarify any ambiguities in the question
6. Distinguish between "must" (rules) and "should" (etiquette)

## KEY KNOWLEDGE AREAS
- Court dimensions and specifications
- Equipment standards (paddles, balls, nets)
- Serving rules and faults
- Scoring systems
- Non-volley zone (kitchen) rules
- Line calls and officiating
- Tournament regulations
- Recreational vs. competitive play differences
- Adaptive play rules
- Safety guidelines
`;

interface VoiceAssistantHook {
  isConnected: boolean;
  isListening: boolean;
  transcript: string;
  response: string;
  error: string | null;
  startSession: () => Promise<void>;
  endSession: () => void;
  startListening: () => void;
  stopListening: () => void;
}

export const useVoiceAssistant = (apiKey: string | undefined): VoiceAssistantHook => {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const genAIRef = useRef<GoogleGenerativeAI | null>(null);
  const modelRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Gemini AI
  useEffect(() => {
    if (apiKey) {
      try {
        genAIRef.current = new GoogleGenerativeAI(apiKey);
        modelRef.current = genAIRef.current.getGenerativeModel({
          model: 'gemini-1.5-flash',
          generationConfig: {
            temperature: 0.7,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048,
          },
        });
      } catch (err) {
        console.error('Failed to initialize Gemini:', err);
        setError('Failed to initialize AI model');
      }
    }
  }, [apiKey]);

  // Initialize speech recognition
  const initializeSpeechRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return false;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
      console.log('Speech recognition started');
      setIsListening(true);
      setError(null);
    };
    
    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const transcriptText = event.results[current][0].transcript;
      setTranscript(transcriptText);
      
      // If this is a final result, process it
      if (event.results[current].isFinal) {
        processQuestion(transcriptText);
      }
    };
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };
    
    recognition.onend = () => {
      console.log('Speech recognition ended');
      setIsListening(false);
    };
    
    recognitionRef.current = recognition;
    return true;
  }, []);

  // Process the question with Gemini
  const processQuestion = useCallback(async (question: string) => {
    if (!modelRef.current) {
      setError('AI model not initialized');
      return;
    }

    try {
      setResponse('Thinking...');
      
      const prompt = `${PICKLEBALL_SYSTEM_PROMPT}\n\nUser Question: ${question}\n\nPlease provide a clear, accurate answer based on official pickleball rules.`;
      
      const result = await modelRef.current.generateContent(prompt);
      const responseText = result.response.text();
      
      setResponse(responseText);
      
      // Use the new server-side TTS endpoint to get the audio
      console.log('Requesting TTS for response...');
      const ttsResponse = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: responseText }),
      });

      if (!ttsResponse.ok) {
        const errorText = await ttsResponse.text();
        console.error('TTS API error:', ttsResponse.status, errorText);
        throw new Error(`Failed to fetch audio from TTS service: ${ttsResponse.status}`);
      }

      console.log('TTS response received, creating audio...');
      const audioBlob = await ttsResponse.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Stop any existing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      // Add error handling for audio playback
      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        setError('Failed to play audio response');
      };
      
      audio.onplay = () => {
        console.log('Audio playback started');
      };
      
      await audio.play();

    } catch (err: any) {
      console.error('Failed to generate response:', err);
      setError(`Failed to generate response: ${err.message}`);
      setResponse('');
    }
  }, []);

  const startSession = useCallback(async () => {
    if (!apiKey) {
      setError('API key is required');
      return;
    }

    try {
      setError(null);
      
      // Initialize speech recognition
      const speechInitialized = initializeSpeechRecognition();
      if (!speechInitialized) {
        return;
      }

      // Check if Gemini is initialized
      if (!modelRef.current) {
        setError('AI model not initialized. Please check your API key.');
        return;
      }

      setIsConnected(true);
    } catch (err: any) {
      console.error('Failed to start session:', err);
      setError(`Failed to start session: ${err.message}`);
    }
  }, [apiKey, initializeSpeechRecognition]);

  const endSession = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    setIsConnected(false);
    setIsListening(false);
    setTranscript('');
    setResponse('');
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isConnected) {
      setError('No active session. Please start a session first.');
      return;
    }

    try {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setTranscript('');
      setResponse('');
      recognitionRef.current.start();
    } catch (err: any) {
      console.error('Failed to start listening:', err);
      setError(`Failed to start listening: ${err.message}`);
    }
  }, [isConnected]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;

    try {
      recognitionRef.current.stop();
    } catch (err: any) {
      console.error('Failed to stop listening:', err);
      setError(`Failed to stop listening: ${err.message}`);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endSession();
    };
  }, [endSession]);

  return {
    isConnected,
    isListening,
    transcript,
    response,
    error,
    startSession,
    endSession,
    startListening,
    stopListening
  };
};