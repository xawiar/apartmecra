import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { initializePWA } from './utils/pwa'
import { initializeKeepAlive } from './utils/keepAlive'

// Initialize PWA
initializePWA();

// Initialize keep-alive mechanism for push notifications
// This ensures the app stays active even when in background
if (localStorage.getItem('token') && localStorage.getItem('user')) {
  initializeKeepAlive().catch(error => {
    console.error('Failed to initialize keep-alive:', error);
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)