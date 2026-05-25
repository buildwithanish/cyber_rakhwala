import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Initialize utilities
import './utils/pwa';
import './utils/performance';
import './utils/keyboardShortcuts';
import { initAnalytics } from './utils/analytics';
import { initGoogleAnalytics, setDefaultConsent } from './utils/googleAnalytics';
import { initCloudflareAnalytics } from './utils/cloudflare';
import { installDebugHooks } from './utils/debugStore';

// Set default consent before GA initialization
setDefaultConsent();
installDebugHooks();

// Initialize analytics services
initAnalytics();
initGoogleAnalytics();
initCloudflareAnalytics();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
