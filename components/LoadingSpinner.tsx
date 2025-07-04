
import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex justify-center items-center my-4">
      <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-emerald-600"></div>
      <p className="ml-3 text-emerald-700">The Guru is thinking...</p>
    </div>
  );
};
