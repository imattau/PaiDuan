/* @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Ensure React is available globally for components compiled with the classic JSX runtime
(globalThis as any).React = React;
Object.defineProperty(HTMLMediaElement.prototype, 'play', {
  configurable: true,
  value: vi.fn(() => Promise.resolve()),
});
Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
  configurable: true,
  value: vi.fn(),
});

vi.mock('./ReportModal', () => ({ default: () => null }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ prefetch: () => {} }) }));

vi.mock('../hooks/useFollowing', () => ({ default: () => ({ following: [], follow: () => {} }) }));
vi.mock('react-use', () => ({ useNetworkState: () => ({ online: true }) }));
vi.mock('../hooks/useAdaptiveSource', () => ({ default: () => undefined }));
vi.mock('react-intersection-observer', () => ({ useInView: () => ({ ref: () => {}, inView: true }) }));
vi.mock('../hooks/useCurrentVideo', () => ({ useCurrentVideo: () => ({ setCurrent: () => {} }) }));
vi.mock('@/store/feedSelection', () => ({
  useFeedSelection: (selector: any) => selector({ setSelectedVideo: () => {} }),
}));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ state: { status: 'ready', pubkey: 'pk', signer: {} } }) }));
vi.mock('@/hooks/useProfile', () => ({ useProfile: () => ({ picture: '', name: 'author' }) }));
vi.mock('@/hooks/useProfiles', () => ({ prefetchProfile: () => Promise.resolve() }));
const loadSource = vi.fn();
const play = vi.fn(() => Promise.resolve());
const pause = vi.fn();
const onStateChange = vi.fn(() => () => {});
const onError = vi.fn(() => () => {});
vi.mock('@/agents/playback', () => ({
  playback: { loadSource, play, pause, onStateChange, onError },
}));

const { default: VideoCard } = await import('./VideoCard');

afterEach(() => {
  cleanup();

});

describe('VideoCard', () => {
  it('mounts and unmounts without throwing', () => {
    const props = {
      videoUrl: 'video.mp4',
      author: 'author',
      caption: 'caption',
      eventId: 'event',
      pubkey: 'pk',
      zap: <div />,
    };
    const { unmount } = render(<VideoCard {...props} />);
    expect(loadSource).toHaveBeenCalled();
    expect(() => unmount()).not.toThrow();
  });

  it('shows and hides placeholder around video load and fires onReady', async () => {
    const onReady = vi.fn();
    const props = {
      videoUrl: 'video.mp4',
      author: 'author',
      caption: 'caption',
      eventId: 'event',
      pubkey: 'pk',
      zap: <div />,
      onReady,
    };
    const { container } = render(<VideoCard {...props} />);
    await screen.findByText('Loading video…');
    const video = container.querySelector('video') as HTMLVideoElement;
    fireEvent.loadedData(video);
    await waitFor(() => {
      expect(screen.queryByText('Loading video…')).toBeNull();
      expect(onReady).toHaveBeenCalled();
    });
  });

  it('toggles mute state with action bar button', async () => {
    const props = {
      videoUrl: 'video.mp4',
      author: 'author',
      caption: 'caption',
      eventId: 'event',
      pubkey: 'pk',
      zap: <div />,
    };
    render(<VideoCard {...props} />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: /unmute/i }));
    await screen.findByRole('button', { name: /mute/i });
  });

  it('shows action bar with z-index and triggers comment callback', async () => {
    const onComment = vi.fn();
    const props = {
      videoUrl: 'video.mp4',
      author: 'author',
      caption: 'caption',
      eventId: 'event',
      pubkey: 'pk',
      onComment,
      zap: <div />,
    };
    render(<VideoCard {...props} />);
    const volumeButton = await screen.findByRole('button', { name: /unmute/i });
    expect(volumeButton.parentElement?.className).toMatch(/z-10/);
    const user = userEvent.setup();
    await user.click(screen.getByLabelText(/comments/i));
    expect(onComment).toHaveBeenCalled();
  });
});
