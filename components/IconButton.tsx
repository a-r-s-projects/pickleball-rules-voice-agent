
import React from 'react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  // Additional specific props can be added here if needed
}

export const IconButton: React.FC<IconButtonProps> = ({ children, className, ...props }) => {
  return (
    <button
      {...props}
      className={`flex items-center justify-center font-medium focus:outline-none transition-colors duration-150 ${className}`}
    >
      {children}
    </button>
  );
};
