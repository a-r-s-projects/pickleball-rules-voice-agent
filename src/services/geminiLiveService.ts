// Simplified service for any remaining non-live Gemini calls
import { GoogleGenAI } from '@google/genai';

const PICKLEBALL_SYSTEM_PROMPT = `[Same 459-line prompt]`;

export const askPickleballGuruFallback = async (
  question: string, 
  apiKey: string
): Promise<{ text: string }> => {
  if (!apiKey) {
    throw new Error("Gemini API key is not provided.");
  }
  
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: question,
      config: {
        systemInstruction: PICKLEBALL_SYSTEM_PROMPT,
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
    });

    return { text: response.text || "" };
  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    throw new Error(`Failed to get answer: ${error.message || 'Unknown error'}`);
  }
};