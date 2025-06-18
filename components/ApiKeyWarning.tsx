
import React from 'react';

export const ApiKeyWarning: React.FC = () => {
  return (
    <div className="w-full max-w-2xl bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow" role="alert">
      <p className="font-bold">API Key Missing</p>
      <p>The Gemini API key (API_KEY) is not configured in your environment variables. This application requires an API key to function.</p>
      <p className="mt-2 text-sm">Please ensure the <code>API_KEY</code> environment variable is set.</p>
    </div>
  );
};
