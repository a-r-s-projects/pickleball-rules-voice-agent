import { VercelRequest, VercelResponse } from '@vercel/node';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';

// Initialize the Text-to-Speech client
const ttsClient = new TextToSpeechClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text to synthesize is required.' });
  }

  try {
    const request = {
      input: { text: text.replace(/\*/g, '') },
      // Voice selection
      voice: { languageCode: 'en-US', name: 'en-US-Standard-I' },
      // Audio configuration
      audioConfig: { audioEncoding: 'MP3' },
    };

    // @ts-ignore
    const [response] = await ttsClient.synthesizeSpeech(request);
    const audioContent = response.audioContent;

    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(audioContent);

  } catch (error) {
    console.error('Error synthesizing speech:', error);
    res.status(500).json({ error: 'Failed to synthesize speech.' });
  }
}