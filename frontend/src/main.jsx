import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#1a1a1a',
          color: '#f0f0f0',
          border: '1px solid #2a2a2a',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '14px',
          borderRadius: '12px',
        },
        success: { iconTheme: { primary: '#a3e635', secondary: '#0a0a0a' } },
        error:   { iconTheme: { primary: '#ef4444', secondary: '#0a0a0a' } },
      }}
    />
  </React.StrictMode>
);
