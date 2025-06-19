import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    // Check if Google credentials are set
    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    
    if (!credentialsJson) {
      return res.status(500).json({ 
        error: 'GOOGLE_APPLICATION_CREDENTIALS_JSON not set',
        status: 'Configuration Error'
      });
    }

    // Try to parse the credentials
    let credentials;
    try {
      credentials = JSON.parse(credentialsJson);
    } catch (e) {
      return res.status(500).json({ 
        error: 'Invalid GOOGLE_APPLICATION_CREDENTIALS_JSON format',
        status: 'Configuration Error'
      });
    }

    // Basic validation of credentials structure
    if (!credentials.client_email || !credentials.private_key) {
      return res.status(500).json({ 
        error: 'Missing required fields in credentials',
        status: 'Configuration Error'
      });
    }

    // Test the TTS endpoint
    const testText = "Testing Google Cloud Text to Speech with voice en-US-Standard-I";
    const ttsResponse = await fetch(`${req.headers.origin || 'https://' + req.headers.host}/api/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: testText }),
    });

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      return res.status(500).json({ 
        error: 'TTS API call failed',
        status: ttsResponse.status,
        details: errorText
      });
    }

    // Success!
    return res.status(200).json({ 
      status: 'OK',
      message: 'TTS API is configured correctly',
      voice: 'en-US-Standard-I (Male)',
      testText: testText
    });

  } catch (error: any) {
    console.error('TTS test error:', error);
    return res.status(500).json({ 
      error: 'Test failed',
      details: error.message 
    });
  }
}