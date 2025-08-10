/* @vitest-environment jsdom */
import { describe, it, expect, beforeEach } from 'vitest';
import playback from './playback';

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
  beforeEach(() => {
    sessionStorage.clear();
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
});
