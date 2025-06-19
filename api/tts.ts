import { VercelRequest, VercelResponse } from '@vercel/node';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';

// Initialize the Text-to-Speech client with credentials from environment variable
let ttsClient: TextToSpeechClient;

function getTTSClient() {
  if (!ttsClient) {
    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    
    if (!credentialsJson) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set');
    }

    try {
      const credentials = JSON.parse(credentialsJson);
      ttsClient = new TextToSpeechClient({
        credentials: credentials,
        projectId: credentials.project_id
      });
    } catch (error) {
      console.error('Failed to parse Google credentials:', error);
      throw new Error('Invalid GOOGLE_APPLICATION_CREDENTIALS_JSON format');
    }
  }
  
  return ttsClient;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text to synthesize is required.' });
  }

  try {
    // Get the TTS client
    const client = getTTSClient();

    // Remove asterisks and clean up the text
    const cleanText = text.replace(/\*/g, '').trim();

    const request = {
      input: { text: cleanText },
      // Voice selection - Using the male voice as requested
      voice: { 
        languageCode: 'en-US', 
        name: 'en-US-Standard-I',
        ssmlGender: 'MALE' as const
      },
      // Audio configuration
      audioConfig: { 
        audioEncoding: 'MP3' as const,
        pitch: 0,
        speakingRate: 1.0
      },
    };

    console.log('Synthesizing speech with voice:', request.voice.name);
    
    // @ts-ignore - TypeScript issues with Google Cloud types
    const [response] = await client.synthesizeSpeech(request);
    
    if (!response.audioContent) {
      throw new Error('No audio content received from Google TTS');
    }

    const audioContent = response.audioContent;

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-cache');
    res.send(audioContent);

  } catch (error: any) {
    console.error('Error synthesizing speech:', error);
    
    // Provide more detailed error information
    const errorMessage = error.message || 'Failed to synthesize speech';
    const statusCode = error.code === 7 ? 403 : 500; // 7 = PERMISSION_DENIED
    
    res.status(statusCode).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    });
  }
}