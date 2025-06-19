export const ApiKeyWarning = () => (
  <div style={{ 
    padding: '16px', 
    backgroundColor: '#fee', 
    border: '1px solid #fcc',
    borderRadius: '4px',
    margin: '16px 0',
    color: '#c00'
  }}>
    API Key not found. Please set the VITE_GEMINI_API_KEY environment variable in your .env file.
  </div>
);
