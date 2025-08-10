/* @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { createRoot } from 'react-dom/client';

// Ensure React is available globally for components compiled with the classic JSX runtime
(globalThis as any).React = React;

vi.mock('@videojs-player/react', () => {
  const React = require('react');
  return {
    VideoPlayer: ({ onReady }: any) => {
      const element: any = { parentNode: {} };
      const player = {
        el: () => element,
        dispose: vi.fn(() => {
          if (!element.parentNode) {
            throw new DOMException('NotFoundError');
          }
          element.parentNode = null;
        }),
        muted: () => {},
        play: () => ({ catch: () => {} }),
      } as any;
      React.useEffect(() => {
        onReady?.(player);
        return () => player.dispose();
      }, []);
      return <div />;
    },
  };
});

vi.mock('./ZapButton', () => ({ default: () => <div /> }));
vi.mock('./CommentDrawer', () => ({ default: () => <div /> }));
vi.mock('./ReportModal', () => ({ default: () => null }));

vi.mock('../hooks/useFollowing', () => ({ default: () => ({ following: [], follow: () => {} }) }));
vi.mock('react-use', () => ({ useNetworkState: () => ({ online: true }) }));
vi.mock('../hooks/useAdaptiveSource', () => ({ default: () => undefined }));
vi.mock('react-intersection-observer', () => ({ useInView: () => ({ ref: () => {}, inView: true }) }));
vi.mock('../hooks/useCurrentVideo', () => ({ useCurrentVideo: () => ({ setCurrent: () => {} }) }));
vi.mock('@/store/feedSelection', () => ({ useFeedSelection: () => ({ setSelectedVideo: () => {} }) }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ state: { status: 'ready', pubkey: 'pk', signer: {} } }) }));
vi.mock('@/hooks/useProfile', () => ({ useProfile: () => ({ picture: '', name: 'author' }) }));
vi.mock('@/hooks/useProfiles', () => ({ prefetchProfile: () => Promise.resolve() }));
vi.mock('@/agents/nostr', () => ({ nostr: { repost: () => Promise.resolve() } }));

vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ headers: new Headers({ 'content-type': 'video/mp4' }) })));

const { default: VideoCard } = await import('./VideoCard');

describe('VideoCard', () => {
  it('mounts and unmounts without throwing NotFoundError', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    const root = createRoot(div);
    const props = {
      videoUrl: 'video.mp4',
      author: 'author',
      caption: 'caption',
      eventId: 'event',
      lightningAddress: 'la',
      pubkey: 'pk',
    };
    expect(() => {
      root.render(<VideoCard {...props} />);
      root.unmount();
    }).not.toThrow();
  });
});
