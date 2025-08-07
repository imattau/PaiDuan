import React, { createContext, useContext, useEffect, useState } from 'react';

type Mode = 'light' | 'dark';

interface ThemeContextValue {
  mode: Mode;
  accent: string;
  toggleMode: () => void;
  setAccent: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<Mode>('light');
  const [accent, setAccentState] = useState<string>('#3b82f6');

  // initial load
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedMode = localStorage.getItem('theme-mode') as Mode | null;
    const savedAccent = localStorage.getItem('theme-accent');
    if (savedMode) {
      setMode(savedMode);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setMode('dark');
    }
    if (savedAccent) setAccentState(savedAccent);
  }, []);

  // apply mode
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', mode === 'dark');
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme-mode', mode);
    }
  }, [mode]);

  // apply accent
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--accent', accent);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme-accent', accent);
    }
  }, [accent]);

  const toggleMode = () => setMode((m) => (m === 'light' ? 'dark' : 'light'));
  const setAccent = (c: string) => setAccentState(c);

  return (
    <ThemeContext.Provider value={{ mode, accent, toggleMode, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export default useTheme;
