/* @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from 'vitest';
let playback: typeof import('./playback').default;

Object.defineProperty(HTMLMediaElement.prototype, 'play', {
  configurable: true,
  value: () => Promise.resolve(),
});
Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
  configurable: true,
  value: () => {},
});
Object.defineProperty(HTMLMediaElement.prototype, 'load', {
  configurable: true,
  value: () => {},
});

describe('playback progress', () => {
  beforeEach(async () => {
    sessionStorage.clear();
    vi.resetModules();
    playback = (await import('./playback')).default;
  });

  it('saves and restores progress for multiple videos', () => {
    const v1 = document.createElement('video');
    playback.loadSource(v1, { videoUrl: 'a.mp4', eventId: 'evt1' });
    v1.currentTime = 12;
    playback.pause();

    const v2 = document.createElement('video');
    playback.loadSource(v2, { videoUrl: 'b.mp4', eventId: 'evt2' });
    v2.currentTime = 34;
    playback.pause();

    const v1b = document.createElement('video');
    playback.loadSource(v1b, { videoUrl: 'a.mp4', eventId: 'evt1' });
    v1b.dispatchEvent(new Event('loadedmetadata'));
    expect(v1b.currentTime).toBeCloseTo(12);

    const v2b = document.createElement('video');
    playback.loadSource(v2b, { videoUrl: 'b.mp4', eventId: 'evt2' });
    v2b.dispatchEvent(new Event('loadedmetadata'));
    expect(v2b.currentTime).toBeCloseTo(34);
  });

  it('clears only the ended video progress', () => {
    const v1 = document.createElement('video');
    playback.loadSource(v1, { videoUrl: 'a.mp4', eventId: 'evt1' });
    v1.currentTime = 5;
    playback.pause();

    const v2 = document.createElement('video');
    playback.loadSource(v2, { videoUrl: 'b.mp4', eventId: 'evt2' });
    v2.currentTime = 7;
    playback.pause();

    v2.dispatchEvent(new Event('ended'));

    const stored = JSON.parse(sessionStorage.getItem('lastPlaybackPosition')!);
    expect(stored).toHaveProperty('evt1');
    expect(stored).not.toHaveProperty('evt2');
  });

  it('restores progress when switching between videos', () => {
    const first = document.createElement('video');
    playback.loadSource(first, { videoUrl: 'a.mp4', eventId: 'evt1' });
    first.currentTime = 10;
    first.dispatchEvent(new Event('pause'));

    const second = document.createElement('video');
    playback.loadSource(second, { videoUrl: 'b.mp4', eventId: 'evt2' });
    second.currentTime = 20;
    second.dispatchEvent(new Event('pause'));

    const firstAgain = document.createElement('video');
    playback.loadSource(firstAgain, { videoUrl: 'a.mp4', eventId: 'evt1' });
    firstAgain.dispatchEvent(new Event('loadedmetadata'));
    expect(firstAgain.currentTime).toBeCloseTo(10);
  });

  it('prunes expired entries', async () => {
    vi.useFakeTimers();
    const start = Date.now();
    const v = document.createElement('video');
    playback.loadSource(v, { videoUrl: 'a.mp4', eventId: 'evt3' });
    v.currentTime = 5;
    v.dispatchEvent(new Event('pause'));

    vi.setSystemTime(start + 24 * 60 * 60 * 1000 + 1);
    vi.resetModules();
    playback = (await import('./playback')).default;
    const v2 = document.createElement('video');
    playback.loadSource(v2, { videoUrl: 'a.mp4', eventId: 'evt3' });
    v2.dispatchEvent(new Event('loadedmetadata'));
    expect(v2.currentTime).toBe(0);
    expect(sessionStorage.getItem('lastPlaybackPosition')).toBeNull();
    vi.useRealTimers();
  });
});
