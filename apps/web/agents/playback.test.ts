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

  it('saves and restores progress', () => {
    const v1 = document.createElement('video');
    playback.loadSource(v1, { videoUrl: 'a.mp4', eventId: 'evt1' });
    v1.currentTime = 12;
    playback.pause();

    const v2 = document.createElement('video');
    playback.loadSource(v2, { videoUrl: 'a.mp4', eventId: 'evt1' });
    v2.dispatchEvent(new Event('loadedmetadata'));
    expect(v2.currentTime).toBeCloseTo(12);
  });

  it('clears progress on ended', () => {
    const v = document.createElement('video');
    playback.loadSource(v, { videoUrl: 'a.mp4', eventId: 'evt2' });
    v.currentTime = 5;
    playback.pause();
    v.dispatchEvent(new Event('ended'));
    expect(sessionStorage.getItem('lastPlaybackPosition')).toBeNull();
  });
});
