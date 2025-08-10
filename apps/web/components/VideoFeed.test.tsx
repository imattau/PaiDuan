import React from 'react';
import { describe, it, expect, vi } from 'vitest';
vi.mock('react-virtuoso', () => ({ Virtuoso: (props: any) => <div {...props} /> }));
import { renderToStaticMarkup } from 'react-dom/server';
import VideoFeed from './VideoFeed';

// Ensure React is available globally for components compiled with the classic JSX runtime
(globalThis as any).React = React;

describe('VideoFeed', () => {
  it('renders placeholder when no videos', () => {
    const html = renderToStaticMarkup(<VideoFeed onAuthorClick={() => {}} />);
    expect(html).toContain('No videos yet');
  });
});
