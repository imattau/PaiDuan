/* @vitest-environment jsdom */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { useFollowingStore } from '@/store/following';

// Ensure React is available globally for components compiled with the classic JSX runtime
;(globalThis as any).React = React;

// Mock media element methods
Object.defineProperty(HTMLMediaElement.prototype, 'play', {
  configurable: true,
  value: vi.fn(() => Promise.resolve()),
});
Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
  configurable: true,
  value: vi.fn(),
});
Object.defineProperty(HTMLMediaElement.prototype, 'load', {
  configurable: true,
  value: vi.fn(),
});

vi.mock('./ReportModal', () => ({ default: () => null }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ prefetch: () => {} }) }));
vi.mock('react-use', () => ({ useNetworkState: () => ({ online: true }) }));
vi.mock('../hooks/useAdaptiveSource', () => ({ default: () => undefined }));
let mockInView = true;
vi.mock('react-intersection-observer', () => ({
  useInView: () => ({ ref: () => {}, inView: mockInView }),
}));
vi.mock('../hooks/useCurrentVideo', () => ({ useCurrentVideo: () => ({ setCurrent: () => {} }) }));
const feedSelectionState = { selectedVideoId: undefined as string | undefined, setSelectedVideo: () => {} };
vi.mock('@/store/feedSelection', () => ({
  useFeedSelection: (selector: any) => selector(feedSelectionState),
}));
vi.mock('@/hooks/useProfile', () => ({ useProfile: () => ({ picture: '', name: 'author' }) }));
vi.mock('@/hooks/useProfiles', () => ({ prefetchProfile: () => Promise.resolve() }));
vi.mock('@/agents/telemetry', () => ({ telemetry: { track: vi.fn() } }));
const currentRef = { video: null as HTMLVideoElement | null };
const { loadSource, play, playbackPause, onStateChange, onError } = vi.hoisted(() => ({
  loadSource: vi.fn((video: HTMLVideoElement) => {
    if (currentRef.video && currentRef.video !== video) currentRef.video.pause();
    currentRef.video = video;
  }),
  play: vi.fn(() => Promise.resolve()),
  playbackPause: vi.fn(),
  onStateChange: vi.fn(() => () => {}),
  onError: vi.fn(() => () => {}),
}));
vi.mock('@/agents/playback', () => ({
  playback: { loadSource, play, pause: playbackPause, onStateChange, onError },
}));

import VideoCard from './VideoCard';

afterEach(() => {
  mockInView = true;
  feedSelectionState.selectedVideoId = undefined;
  loadSource.mockClear();
  play.mockClear();
  playbackPause.mockClear();
  currentRef.video = null;
});

describe('VideoCard playback switching', () => {
  it('only plays the most recent video', async () => {
    useFollowingStore.setState({ following: [] });
    const playMock = HTMLMediaElement.prototype.play as unknown as vi.Mock;
    const pauseMock = HTMLMediaElement.prototype.pause as unknown as vi.Mock;
    playMock.mockClear();
    pauseMock.mockClear();

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

    const { rerender, container } = render(<Wrapper showSecond={false} />);
    const video1 = container.querySelector('video') as HTMLVideoElement;
    fireEvent.loadedData(video1);
    await waitFor(() => expect(playMock).toHaveBeenCalledTimes(1));
    expect(pauseMock).not.toHaveBeenCalled();

    rerender(<Wrapper showSecond={true} />);
    const videos = container.querySelectorAll('video');
    const video2 = videos[1] as HTMLVideoElement;
    fireEvent.loadedData(video2);
    await waitFor(() => expect(playMock).toHaveBeenCalledTimes(2));
    expect(pauseMock).toHaveBeenCalledTimes(1);
  });

  it('preloads selected video when out of view and plays on enter', async () => {
    useFollowingStore.setState({ following: [] });
    mockInView = false;
    feedSelectionState.selectedVideoId = 'event1';
    const props = {
      videoUrl: 'video1.mp4',
      author: 'author1',
      caption: 'caption1',
      eventId: 'event1',
      pubkey: 'pk1',
      zap: <div />,
    };
    const { rerender, container } = render(<VideoCard {...props} />);
    await waitFor(() => expect(loadSource).toHaveBeenCalledTimes(1));
    expect(play).not.toHaveBeenCalled();
    const video = container.querySelector('video') as HTMLVideoElement;
    fireEvent.loadedData(video);
    expect(play).not.toHaveBeenCalled();
    mockInView = true;
    rerender(<VideoCard {...props} />);
    await waitFor(() => expect(play).toHaveBeenCalledTimes(1));
    expect(loadSource).toHaveBeenCalledTimes(1);
  });
});

