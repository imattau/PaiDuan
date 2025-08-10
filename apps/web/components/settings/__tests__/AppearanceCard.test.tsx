/* @vitest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'next-themes';
import { describe, it, expect, vi } from 'vitest';
import AppearanceCard from '../AppearanceCard';
import { themes } from '@/agents/theme';

vi.mock('../../../hooks/useT', () => ({ default: () => (k: string) => k }));

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

describe('AppearanceCard', () => {
  it('updates data-theme on selection', () => {
    render(
      <ThemeProvider attribute="data-theme" themes={themes} defaultTheme="light">
        <AppearanceCard />
      </ThemeProvider>
    );

    const select = screen.getByRole('combobox');
    for (const theme of themes) {
      fireEvent.change(select, { target: { value: theme } });
      expect(document.documentElement.getAttribute('data-theme')).toBe(theme);
    }
  });
});
