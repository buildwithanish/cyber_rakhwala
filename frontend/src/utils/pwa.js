/**
 * PWA Registration Utility
 * Register service worker and handle updates
 */

let registration = null;
const PWA_ENABLED = import.meta.env.VITE_ENABLE_PWA === 'true';

const clearDevelopmentServiceWorkers = async () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((item) => item.unregister()));

    if ('caches' in window) {
      const keys = await window.caches.keys();
      await Promise.all(keys.map((key) => window.caches.delete(key)));
    }

    console.log('[PWA] Cleared service workers and caches for development');
  } catch (error) {
    console.warn('[PWA] Failed to clear development service workers:', error);
  }
};

export const registerServiceWorker = async () => {
  if (!PWA_ENABLED) {
    return;
  }

  if ('serviceWorker' in navigator) {
    try {
      registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
      });

      console.log('[PWA] Service Worker registered:', registration.scope);

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker available
            console.log('[PWA] New version available');
            
            // Show update notification
            if (confirm('A new version is available. Reload to update?')) {
              newWorker.postMessage({ type: 'SKIP_WAITING' });
              window.location.reload();
            }
          }
        });
      });

      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000); // Check every hour

    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
    }
  }
};

export const unregisterServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.unregister();
      console.log('[PWA] Service Worker unregistered');
    }
  }
};

export const checkForUpdates = async () => {
  if (registration) {
    await registration.update();
  }
};

// Install prompt
let deferredPrompt = null;

if (typeof window !== 'undefined' && PWA_ENABLED) {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('[PWA] Install prompt available');
  });
}

export const showInstallPrompt = async () => {
  if (!deferredPrompt) {
    return false;
  }

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  
  console.log('[PWA] Install prompt outcome:', outcome);
  deferredPrompt = null;
  
  return outcome === 'accepted';
};

export const isPWAInstalled = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  const supportsMatchMedia = typeof window.matchMedia === 'function';
  const standaloneByMedia = supportsMatchMedia
    ? Boolean(window.matchMedia('(display-mode: standalone)')?.matches)
    : false;

  return standaloneByMedia || window.navigator.standalone === true;
};

// Auto-register on import (disabled in development to prevent module loading issues)
if (typeof window !== 'undefined' && PWA_ENABLED && import.meta.env.PROD) {
  registerServiceWorker();
} else if (typeof window !== 'undefined' && import.meta.env.DEV) {
  clearDevelopmentServiceWorkers();
}

export default {
  registerServiceWorker,
  unregisterServiceWorker,
  checkForUpdates,
  showInstallPrompt,
  isPWAInstalled,
};
