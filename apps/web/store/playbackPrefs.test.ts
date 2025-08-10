import { describe, it, expect, beforeEach } from 'vitest';
import { usePlaybackPrefs } from './playbackPrefs';

describe('playbackPrefs store', () => {
  beforeEach(() => {
    usePlaybackPrefs.setState({ isMuted: true });
  });

  it('defaults to muted', () => {
    expect(usePlaybackPrefs.getState().isMuted).toBe(true);
  });

  it('mutes on autoplay rejection', () => {
    const { setMuted, handleAutoplayRejected } = usePlaybackPrefs.getState();
    setMuted(false);
    expect(usePlaybackPrefs.getState().isMuted).toBe(false);
    handleAutoplayRejected();
    expect(usePlaybackPrefs.getState().isMuted).toBe(true);
  });
});
