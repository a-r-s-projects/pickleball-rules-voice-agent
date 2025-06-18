
import React from 'react';
import { ProcessedGroundingSource } from '../types';

interface AnswerCardProps {
  question: string;
  answer: string;
  groundingSources: ProcessedGroundingSource[];
  isMobile: boolean;
}

export const AnswerCard: React.FC<AnswerCardProps> = ({ question, answer, groundingSources, isMobile }) => {
  if (!question && !answer) return null;

  return (
    <div className="w-full bg-emerald-50 p-6 rounded-lg shadow-md space-y-4">
      {question && (
        <div>
          <h2 className="text-lg font-semibold text-emerald-700 mb-1">Your Question:</h2>
          <p className="text-gray-700 italic">"{question}"</p>
        </div>
      )}
      {answer && (
        <div>
          <h2 className="text-lg font-semibold text-emerald-700 mb-1">Guru's Answer:</h2>
          <p className="text-gray-800 whitespace-pre-wrap">{answer}</p>
        </div>
      )}
      {groundingSources && groundingSources.length > 0 && (
         <div className="pt-3 mt-3 border-t border-emerald-200">
          <h3 className="text-sm font-semibold text-emerald-600 mb-2">Sources:</h3>
          <ul className="list-disc list-inside space-y-1 text-xs">
            {groundingSources.map((source, index) => (
              <li key={index} className="text-gray-600">
                {source.uri ? (
                  <a 
                    href={source.uri} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-emerald-600 hover:text-emerald-800 hover:underline break-all"
                    title={source.title || source.uri}
                  >
                    {isMobile && source.title && source.title.length > 50 ? `${source.title.substring(0, 47)}...` : (source.title || source.uri)}
                  </a>
                ) : (
                  <span title={source.title || 'Unknown source'}>{source.title || 'Unknown source'}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
