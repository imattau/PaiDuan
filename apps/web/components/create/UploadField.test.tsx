/* @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient';
import CreateVideoForm from './CreateVideoForm';

// minimal mocks required by component
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ state: { status: 'ready' } }),
}));
vi.mock('../../hooks/useProfile', () => ({ useProfile: () => ({}) }));
vi.mock('../../hooks/useFollowing', () => ({ default: () => ({ following: [] }) }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ back: vi.fn() }) }));

;(globalThis as any).React = React;


describe('UploadField', () => {
  it('accepts common video formats', () => {
    const container = document.createElement('div');
    const root = createRoot(container);
    act(() => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <CreateVideoForm />
        </QueryClientProvider>,
      );
    });
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeTruthy();
    expect(fileInput.accept).toContain('.mp4');
    expect(fileInput.accept).toContain('.webm');
    expect(fileInput.accept).toContain('.mov');
    expect(fileInput.accept).toContain('.ogg');
  });
});
