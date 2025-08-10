/* @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { usePlaybackPrefs } from '@/store/playbackPrefs';
import { useFollowingStore } from '@/store/following';

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

vi.mock('react-use', () => ({ useNetworkState: () => ({ online: true }) }));
vi.mock('../hooks/useAdaptiveSource', () => ({ default: () => undefined }));
vi.mock('react-intersection-observer', () => ({
  useInView: () => ({ ref: () => {}, inView: true }),
}));
vi.mock('../hooks/useCurrentVideo', () => ({ useCurrentVideo: () => ({ setCurrent: () => {} }) }));
vi.mock('@/store/feedSelection', () => ({
  useFeedSelection: (selector: any) => selector({ setSelectedVideo: () => {} }),
}));
vi.mock('@/hooks/useProfile', () => ({ useProfile: () => ({ picture: '', name: 'author' }) }));
vi.mock('@/hooks/useProfiles', () => ({ prefetchProfile: () => Promise.resolve() }));
vi.mock('@/store/playbackPrefs', () => {
  const { create } = require('zustand');
  const usePlaybackPrefs = create((set: any) => ({
    isMuted: true,
    setMuted: (isMuted: boolean) => set({ isMuted }),
  }));
  return { usePlaybackPrefs };
});
let currentVideo: HTMLVideoElement | null = null;
const loadSource = vi.fn((video: HTMLVideoElement, _opts: any) => {
  if (currentVideo && currentVideo !== video) currentVideo.pause();
  currentVideo = video;
});
const play = vi.fn(() => Promise.resolve());
const playbackPause = vi.fn();
const onStateChange = vi.fn(() => () => {});
const onError = vi.fn(() => () => {});
vi.mock('@/agents/playback', () => ({
  playback: { loadSource, play, pause: playbackPause, onStateChange, onError },
}));

const { default: VideoCard } = await import('./VideoCard');

afterEach(() => {
  cleanup();
  usePlaybackPrefs.setState({ isMuted: true });
  useFollowingStore.setState({ following: [] });
  currentVideo = null;
  (HTMLMediaElement.prototype.pause as unknown as vi.Mock).mockClear();
  play.mockClear();
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

  it('persists mute preference between renders', async () => {
    const props = {
      videoUrl: 'video.mp4',
      author: 'author',
      caption: 'caption',
      eventId: 'event',
      pubkey: 'pk',
      zap: <div />,
    };
    const user = userEvent.setup();
    const { unmount } = render(<VideoCard {...props} />);
    await user.click(await screen.findByRole('button', { name: /unmute/i }));
    await screen.findByRole('button', { name: /mute/i });
    unmount();
    render(<VideoCard {...props} />);
    await screen.findByRole('button', { name: /mute/i });
  });

  it('pauses first video when second loads and retains mute preference', async () => {
    const props1 = {
      videoUrl: 'video1.mp4',
      author: 'author1',
      caption: 'caption1',
      eventId: 'event1',
      pubkey: 'pk1',
      zap: <div />,
    };
    const props2 = {
      videoUrl: 'video2.mp4',
      author: 'author2',
      caption: 'caption2',
      eventId: 'event2',
      pubkey: 'pk2',
      zap: <div />,
    };
    const Wrapper = ({ showSecond }: { showSecond: boolean }) => (
      <>
        <VideoCard {...props1} />
        {showSecond && <VideoCard {...props2} />}
      </>
    );
    const user = userEvent.setup();
    const { container, rerender } = render(<Wrapper showSecond={false} />);
    const video1 = container.querySelector('video') as HTMLVideoElement;
    fireEvent.loadedData(video1);
    await user.click(await screen.findByRole('button', { name: /unmute/i }));
    await screen.findByRole('button', { name: /mute/i });
    rerender(<Wrapper showSecond={true} />);
    expect(
      HTMLMediaElement.prototype.pause as unknown as vi.Mock
    ).toHaveBeenCalledTimes(1);
    const videos = container.querySelectorAll('video');
    const video2 = videos[1] as HTMLVideoElement;
    fireEvent.loadedData(video2);
    expect(video2.muted).toBe(false);
    expect(screen.getAllByRole('button', { name: /mute/i })).toHaveLength(2);
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
