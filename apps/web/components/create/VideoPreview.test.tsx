/* @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import VideoPreview from './VideoPreview';

(globalThis as any).React = React;

describe('VideoPreview', () => {
  it('renders placeholder when no preview', () => {
    const container = document.createElement('div');
    const root = createRoot(container);
    act(() => {
      root.render(
        <VideoPreview
          preview={null}
          err={null}
          progress={0}
          getRootProps={() => ({})}
          getInputProps={() => ({})}
          isDragActive={false}
            videoRef={{ current: null } as React.RefObject<HTMLVideoElement | null>}
          noVideoMessage="no video"
          dropMessage="drop"
        />,
      );
    });
    expect(container.textContent).toContain('no video');
  });

  it('shows progress bar', () => {
    const container = document.createElement('div');
    const root = createRoot(container);
    act(() => {
      root.render(
        <VideoPreview
          preview="blob:vid"
          err={null}
          progress={50}
          getRootProps={() => ({})}
          getInputProps={() => ({})}
          isDragActive={false}
            videoRef={{ current: null } as React.RefObject<HTMLVideoElement | null>}
          noVideoMessage="no video"
          dropMessage="drop"
        />,
      );
    });
    const bar = container.querySelector('.bg-blue-500');
    expect(bar).not.toBeNull();
  });
});
