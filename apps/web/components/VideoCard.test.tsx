/* @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
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

vi.mock('./ZapButton', () => ({ default: () => <div /> }));
const mockCommentDrawer = vi.fn((props: any) => <div data-open={props.open} />);
vi.mock('./CommentDrawer', () => ({ default: mockCommentDrawer }));
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
vi.mock('@/agents/nostr', () => ({ nostr: { repost: () => Promise.resolve() } }));

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

const { default: VideoCard } = await import('./VideoCard');

afterEach(() => {
  cleanup();

});

describe('VideoCard', () => {
  it('mounts and unmounts without throwing NotFoundError', () => {
    fetchMock.mockResolvedValue({ headers: new Headers({ 'content-type': 'video/mp4' }) });
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

  it('aborts in-flight requests on unmount', async () => {
    const abortSpy = vi.fn();
    fetchMock.mockImplementation((_url, options: any) => {
      return new Promise((_resolve, reject) => {
        options?.signal?.addEventListener('abort', () => {
          abortSpy();
          reject(new DOMException('Aborted', 'AbortError'));
        });
      });
    });
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
    root.render(<VideoCard {...props} />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    root.unmount();
    expect(abortSpy).toHaveBeenCalled();
  });

  it('toggles mute state with action bar button', async () => {
    fetchMock.mockResolvedValue({ headers: new Headers({ 'content-type': 'video/mp4' }) });
    const props = {
      videoUrl: 'video.mp4',
      author: 'author',
      caption: 'caption',
      eventId: 'event',
      lightningAddress: 'la',
      pubkey: 'pk',
    };
    render(<VideoCard {...props} />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: /unmute/i }));
    await screen.findByRole('button', { name: /mute/i });
  });

  it('shows action bar with z-index and opens comments', async () => {
    const props = {
      videoUrl: 'video.mp4',
      author: 'author',
      caption: 'caption',
      eventId: 'event',
      lightningAddress: 'la',
      pubkey: 'pk',
    };
    render(<VideoCard {...props} />);
    const volumeButton = await screen.findByRole('button', { name: /unmute/i });
    expect(volumeButton.parentElement?.className).toMatch(/z-10/);
    const user = userEvent.setup();
    await user.click(screen.getByLabelText(/comments/i));
    const lastCall = mockCommentDrawer.mock.calls.at(-1)?.[0];
    expect(lastCall.open).toBe(true);
  });
});
