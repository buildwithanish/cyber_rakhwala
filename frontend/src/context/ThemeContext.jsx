/**
 * Theme Context
 * Manages dark/light theme with persistence and system preference detection
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'cyberRakhwala_theme';

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('dark');
  const [systemPreference, setSystemPreference] = useState('dark');

  // Detect system preference
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    if (!mediaQuery) {
      return undefined;
    }

    setSystemPreference(mediaQuery.matches ? 'dark' : 'light');

    const handler = (e) => setSystemPreference(e.matches ? 'dark' : 'light');

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }

    if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }

    return undefined;
  }, []);

  // Load saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && ['dark', 'light', 'system'].includes(saved)) {
      setTheme(saved);
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    const effectiveTheme = theme === 'system' ? systemPreference : theme;
    
    if (effectiveTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }

    // Update meta theme-color for mobile browsers
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.content = effectiveTheme === 'dark' ? '#0f172a' : '#ffffff';
    }
  }, [theme, systemPreference]);

  // Toggle between dark and light
  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const newTheme = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem(STORAGE_KEY, newTheme);
      return newTheme;
    });
  }, []);

  // Set specific theme
  const setThemeMode = useCallback((mode) => {
    if (['dark', 'light', 'system'].includes(mode)) {
      setTheme(mode);
      localStorage.setItem(STORAGE_KEY, mode);
    }
  }, []);

  // Get effective theme (resolved system preference)
  const effectiveTheme = theme === 'system' ? systemPreference : theme;
  const isDark = effectiveTheme === 'dark';

  const value = {
    theme,
    effectiveTheme,
    isDark,
    systemPreference,
    toggleTheme,
    setTheme: setThemeMode,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
