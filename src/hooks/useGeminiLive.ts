import { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';

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

[... Full 459-line prompt content ...]
`;

interface GeminiLiveHook {
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

export const useGeminiLive = (apiKey: string): GeminiLiveHook => {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const liveSessionRef = useRef<any>(null);
  const aiRef = useRef<GoogleGenAI | null>(null);

  useEffect(() => {
    if (apiKey) {
      aiRef.current = new GoogleGenAI({ apiKey });
    }
  }, [apiKey]);

  const startSession = useCallback(async () => {
    if (!aiRef.current) {
      setError('Gemini API not initialized');
      return;
    }

    try {
      setError(null);
      
      // Create live session with the dedicated live model
      const liveSession = await aiRef.current.live.connect({
        model: 'gemini-2.0-flash-live-001',
        config: {
          systemInstruction: PICKLEBALL_SYSTEM_PROMPT,
          generationConfig: {
            responseModalities: ['TEXT' as any],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: 'Aura'
                }
              }
            }
          }
        },
        callbacks: {
          onmessage: (message: any) => {
            if (message.serverContent) {
              if (message.serverContent.modelTurn?.parts) {
                const textPart = message.serverContent.modelTurn.parts.find(
                  (part: any) => part.text
                );
                if (textPart) {
                  setResponse(textPart.text);
                }
              }
            }
          },
          onerror: (error: any) => {
            console.error('Live session error:', error);
            setError(`Live session error: ${error.message}`);
            setIsConnected(false);
          },
          onclose: () => {
            setIsConnected(false);
            setIsListening(false);
          }
        }
      });

      liveSessionRef.current = liveSession;

      setIsConnected(true);
    } catch (err: any) {
      console.error('Failed to start live session:', err);
      setError(`Failed to start session: ${err.message}`);
    }
  }, []);

  const endSession = useCallback(() => {
    if (liveSessionRef.current) {
      liveSessionRef.current.disconnect();
      liveSessionRef.current = null;
    }
    setIsConnected(false);
    setIsListening(false);
    setTranscript('');
    setResponse('');
  }, []);

  const startListening = useCallback(async () => {
    if (!liveSessionRef.current || !isConnected) {
      setError('No active session');
      return;
    }

    try {
      setIsListening(true);
      setError(null);
      setTranscript('');
      setResponse('');

      // Start real-time audio input
      await liveSessionRef.current.send({
        realtimeInput: {
          mediaChunks: [
            {
              mimeType: 'audio/pcm',
              data: '' // WebRTC will handle the actual audio streaming
            }
          ]
        }
      });

    } catch (err: any) {
      console.error('Failed to start listening:', err);
      setError(`Failed to start listening: ${err.message}`);
      setIsListening(false);
    }
  }, [isConnected]);

  const stopListening = useCallback(async () => {
    if (!liveSessionRef.current) return;

    try {
      // Stop the audio input
      await liveSessionRef.current.send({
        realtimeInput: {
          mediaChunks: []
        }
      });
      setIsListening(false);
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