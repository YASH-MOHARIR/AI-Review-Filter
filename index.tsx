import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // Ensure CSS is imported so Vite bundles it

// Create a container for our Extension UI
const appContainer = document.createElement('div');
appContainer.id = 'smart-review-ai-root';

// Inject it at the top of the body (or find a specific sidebar in Google Maps if possible)
// For Google Maps, standard practice is to prepend to body or find the sidebar pane.
// We will simply fix it to the top of the screen via CSS in App.tsx
document.body.prepend(appContainer);

// Inject Tailwind (Simulated for this demo via CDN, in real prod use postcss)
const script = document.createElement('script');
script.src = "https://cdn.tailwindcss.com";
document.head.appendChild(script);

// Mount React
const root = ReactDOM.createRoot(appContainer);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);