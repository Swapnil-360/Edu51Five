import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Analytics } from '@vercel/analytics/react';
import './index.css';

// Suppress browser extension errors
window.addEventListener('error', (event) => {
  if (event.message?.includes('Could not establish connection') || 
      event.message?.includes('Receiving end does not exist') ||
      event.message?.includes('Extension context invalidated') ||
      event.filename?.includes('content-all.js') ||
      event.filename?.includes('chrome-extension')) {
    event.preventDefault();
    return;
  }
});

window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('Could not establish connection') || 
      event.reason?.message?.includes('Receiving end does not exist') ||
      event.reason?.message?.includes('Extension context invalidated')) {
    event.preventDefault();
    return;
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <SpeedInsights />
    <Analytics />
  </StrictMode>
);

