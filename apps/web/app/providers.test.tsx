/* @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Providers from './providers';
import { useTheme } from 'next-themes';
import { useColorMode } from '@chakra-ui/react';
import { vi } from 'vitest';

// Ensure React is available globally for components compiled with the classic JSX runtime
(globalThis as any).React = React;

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

vi.mock('@/components/ui/Overlay', () => ({ OverlayHost: () => null }));

function TestComponent() {
  const { setTheme } = useTheme();
  const { colorMode } = useColorMode();

  return (
    <>
      <div data-testid="chakra">{colorMode}</div>
      <button onClick={() => setTheme('dark')}>dark</button>
      <button onClick={() => setTheme('light')}>light</button>
    </>
  );
}

describe('Providers theme sync', () => {
  it('syncs next-themes with chakra color mode', async () => {
    const user = userEvent.setup();
    render(
      <Providers>
        <TestComponent />
      </Providers>,
    );

    expect(screen.getByTestId('chakra').textContent).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    await user.click(screen.getByText('dark'));
    await waitFor(() => expect(screen.getByTestId('chakra').textContent).toBe('dark'));
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    await user.click(screen.getByText('light'));
    await waitFor(() => expect(screen.getByTestId('chakra').textContent).toBe('light'));
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});
