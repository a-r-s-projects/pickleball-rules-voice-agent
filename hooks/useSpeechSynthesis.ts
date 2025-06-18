
import { useState, useEffect, useCallback } from 'react';

interface SpeechSynthesisHook {
  speak: (text: string) => void;
  cancelSpeech: () => void;
  isSpeaking: boolean;
  browserSupportsSpeechSynthesis: boolean;
}

export const useSpeechSynthesis = (): SpeechSynthesisHook => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synthRef = typeof window !== 'undefined' ? window.speechSynthesis : null;

  const browserSupportsSpeechSynthesis = !!synthRef;

  const speak = useCallback((text: string) => {
    if (!browserSupportsSpeechSynthesis || !synthRef) {
      console.warn("Speech synthesis not supported or not available.");
      return;
    }
    if (isSpeaking) { // Cancel current speech if any before starting new one
      synthRef.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US'; // You can make this configurable
    
    utterance.onstart = () => {
      setIsSpeaking(true);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    utterance.onerror = (event) => {
      console.error('SpeechSynthesisUtterance.onerror', event);
      setIsSpeaking(false);
    };
    
    synthRef.speak(utterance);
  }, [browserSupportsSpeechSynthesis, synthRef, isSpeaking]);

  const cancelSpeech = useCallback(() => {
    if (browserSupportsSpeechSynthesis && synthRef && isSpeaking) {
      synthRef.cancel();
      setIsSpeaking(false);
    }
  }, [browserSupportsSpeechSynthesis, synthRef, isSpeaking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (browserSupportsSpeechSynthesis && synthRef && isSpeaking) {
        synthRef.cancel();
      }
    };
  }, [browserSupportsSpeechSynthesis, synthRef, isSpeaking]);

  return { speak, cancelSpeech, isSpeaking, browserSupportsSpeechSynthesis };
};
