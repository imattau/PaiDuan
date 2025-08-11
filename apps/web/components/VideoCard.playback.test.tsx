/* @vitest-environment jsdom */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
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
vi.mock('react-intersection-observer', () => ({ useInView: () => ({ ref: () => {}, inView: true }) }));
vi.mock('../hooks/useCurrentVideo', () => ({ useCurrentVideo: () => ({ setCurrent: () => {} }) }));
vi.mock('@/store/feedSelection', () => ({
  useFeedSelection: (selector: any) => selector({ setSelectedVideo: () => {} }),
}));
vi.mock('@/hooks/useProfile', () => ({ useProfile: () => ({ picture: '', name: 'author' }) }));
vi.mock('@/hooks/useProfiles', () => ({ prefetchProfile: () => Promise.resolve() }));
vi.mock('@/agents/telemetry', () => ({ telemetry: { track: vi.fn() } }));
vi.mock('react-player', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: React.forwardRef((props: any, ref: any) => {
      const { onReady, ...rest } = props;
      const videoRef = React.useRef<HTMLVideoElement>(null);
      React.useImperativeHandle(ref, () => ({
        seekTo: (t: number) => {
          if (videoRef.current) videoRef.current.currentTime = t;
        },
        getInternalPlayer: () => videoRef.current,
      }));
      return <video ref={videoRef} onLoadedData={onReady} {...rest} />;
    }),
  };
});

import VideoCard from './VideoCard';

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
});

