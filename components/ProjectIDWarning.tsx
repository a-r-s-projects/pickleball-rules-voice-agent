
import React from 'react';

interface ProjectIDWarningProps {
  placeholder: string;
}

export const ProjectIDWarning: React.FC<ProjectIDWarningProps> = ({ placeholder }) => {
  return (
    <div className="w-full max-w-2xl bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-md shadow" role="alert">
      <p className="font-bold">Google Cloud Project ID Configuration</p>
      <p>The Google Cloud Project ID (GOOGLE_CLOUD_PROJECT_ID) appears to be unconfigured or is using the placeholder value: "<code>{placeholder}</code>".</p>
      <p className="mt-2 text-sm">For optimal grounding with your specific pickleball rules datastore, please set the <code>GOOGLE_CLOUD_PROJECT_ID</code> environment variable to your actual Google Cloud Project ID or Number. If not set correctly, answers might not be sourced from your specific datastore.</p>
    </div>
  );
};
