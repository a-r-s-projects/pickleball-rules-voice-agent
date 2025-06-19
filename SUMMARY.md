# Summary of Work: Pickleball Voice Agent

This document summarizes the troubleshooting, development, and enhancement process for the Pickleball Voice Agent application.

## 1. Initial State & Problem Diagnosis

The project began with a deployed but non-functional Vercel application. The key issues identified were:

*   **"Start Listening" Button Disabled:** The primary user interaction was blocked.
*   **API Key Error:** The frontend was displaying a warning about a missing or invalid API key, even though it was set in the Vercel environment variables.
*   **Deployment Mismatch:** Local code changes were not being correctly pushed to the GitHub repository, causing the Vercel deployment to build from an old, broken commit.

## 2. Transition to Server-Side Text-to-Speech (TTS)

After initial attempts to patch the frontend, the user requested a voice change. This led to a discussion about the limitations of the browser's native Web Speech API (inconsistent voices) and the benefits of a server-side solution.

**Decision:** To achieve a consistent and high-quality user experience, we decided to implement Google Cloud Text-to-Speech.

## 3. Google Cloud Platform Configuration

We undertook the following steps to configure the Google Cloud project for the TTS service:

1.  **Enabled the Text-to-Speech API:** Activated the necessary API in the Google Cloud Console.
2.  **Service Account & Permissions:**
    *   Created a new service account for the application.
    *   Troubleshooted IAM role assignment, ultimately assigning the **"Editor"** role to the service account to resolve permission denials.
3.  **JSON Key Generation:** Created and downloaded a JSON key for the service account.
4.  **Secure Credential Storage:** The contents of the JSON key were securely added as a `GOOGLE_APPLICATION_CREDENTIALS_JSON` environment variable in the Vercel project settings. This prevents the secret key from being exposed in the frontend code.

## 4. Implementation of the TTS Backend

A new serverless function was created to handle the TTS conversion.

*   **File Created:** `pickleball-rules-guru/api/tts.ts`
*   **Dependencies Added:**
    *   `@google-cloud/text-to-speech`: The official Google Cloud client library.
    *   `@vercel/node`: For type definitions in the Vercel serverless environment.
*   **Functionality:**
    *   The function listens for `POST` requests at the `/api/tts` endpoint.
    *   It expects a JSON body containing the `text` to be synthesized.
    *   It uses the `TextToSpeechClient` to send the text to the Google Cloud API.
    *   It returns the synthesized speech as an MP3 audio file (`audio/mpeg`).

## 5. Frontend Refactoring

The frontend hook responsible for voice logic was updated to use the new backend service.

*   **File Modified:** `pickleball-rules-guru/src/hooks/useVoiceAssistant.ts`
*   **Changes:**
    *   Removed all code related to the browser's `speechSynthesis` API.
    *   The `processQuestion` function now makes a `fetch` request to our `/api/tts` endpoint.
    *   It receives the audio blob, creates an object URL, and plays it using an `Audio` element.

## 6. Voice Customization & Final Polish

The final set of changes addressed user requests for voice customization and bug fixes.

*   **Voice Change:** The hardcoded voice in `api/tts.ts` was changed from `en-US-Studio-O` to the user's preferred voice, **`en-US-Standard-I`**.
*   **Asterisk Bug Fix:** A regular expression (`text.replace(/\*/g, '')`) was added to the `api/tts.ts` function to remove any asterisks from the text before sending it to Google. This prevents the TTS engine from speaking the word "asterisk."

## 7. Final Deployment

All changes were successfully committed and pushed to the `main` branch of the GitHub repository, triggering a new Vercel deployment with all the latest features and fixes.