'use client';

import { useTheme as useNextTheme } from 'next-themes';
import { useEffect } from 'react';

export const themes = ['light', 'dark', 'sepia', 'forest'] as const;
export type Theme = (typeof themes)[number];
export type Density = 'compact' | 'cozy';

let currentTheme: Theme = 'light';
let applyTheme = (t: Theme) => {
  document.documentElement.setAttribute('data-theme', t);
};

let setThemeImpl: (t: Theme) => void = (t) => {
  currentTheme = t;
  applyTheme(t);
};

/**
 * Hook to bind next-themes' internal state to this agent.
 * Should be called once near the root of the app.
 */
export function useThemeAgent(): void {
  const { resolvedTheme, setTheme } = useNextTheme();

  useEffect(() => {
    if (resolvedTheme && themes.includes(resolvedTheme as Theme)) {
      currentTheme = resolvedTheme as Theme;
      applyTheme(currentTheme);
    }
  }, [resolvedTheme]);

  useEffect(() => {
    setThemeImpl = (t: Theme) => {
      currentTheme = t;
      setTheme(t);
      applyTheme(t);
    };
  }, [setTheme]);
}

export function getTheme(): Theme {
  return currentTheme;
}

export function setTheme(t: Theme): void {
  setThemeImpl(t);
}

export function setDensity(d: Density): void {
  document.documentElement.dataset.density = d;
}

export function tokens(): Record<string, string> {
  const style = getComputedStyle(document.documentElement);
  const vars = [
    '--background-primary',
    '--background-secondary',
    '--text-primary',
    '--card',
    '--surface',
    '--accent-primary',
    '--accent-hover',
    '--accent-active',
    '--border-primary',
  ];
  const result: Record<string, string> = {};
  for (const v of vars) {
    result[v.slice(2)] = style.getPropertyValue(v).trim();
  }
  return result;
}

export const theme = { getTheme, setTheme, setDensity, tokens };
export default theme;
