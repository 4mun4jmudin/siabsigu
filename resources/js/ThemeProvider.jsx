// resources/js/ThemeProvider.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { themes, DEFAULT_THEME } from './themes';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState(() => {
    try {
      return localStorage.getItem('app_theme') || DEFAULT_THEME;
    } catch (e) {
      return DEFAULT_THEME;
    }
  });

  useEffect(() => {
    try { localStorage.setItem('app_theme', themeName); } catch (e) {}
    document.documentElement.setAttribute('data-theme', themeName);
  }, [themeName]);

  const value = { theme: themes[themeName] || themes[DEFAULT_THEME], themeName, setThemeName };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // fallback: return an object so Dashboard still works if ThemeProvider not mounted
    return { theme: themes[DEFAULT_THEME], themeName: DEFAULT_THEME, setThemeName: () => {} };
  }
  return ctx;
}
