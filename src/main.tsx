
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Add more detailed debugging
console.log('Main script loading...');
console.log('Environment:', import.meta.env.MODE);
console.log('Base URL:', import.meta.env.BASE_URL);
console.log('Window location:', window.location.href);
console.log('Document base URL:', document.baseURI);

// Use StrictMode to catch potential issues early
const rootElement = document.getElementById("root");

if (rootElement) {
  console.log('Root element found, rendering app');
  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("Failed to find root element");
}
