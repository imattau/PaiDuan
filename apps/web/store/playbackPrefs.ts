import { create } from 'zustand';

export type PlaybackPrefsState = {
  isMuted: boolean;
  setMuted: (muted: boolean) => void;
  handleAutoplayRejected: () => void;
};

export const usePlaybackPrefs = create<PlaybackPrefsState>((set, get) => ({
  isMuted: true,
  setMuted: (isMuted) => set({ isMuted }),
  /**
   * If autoplay with sound is rejected by the browser, switch to muted so
   * subsequent videos can start automatically.
   */
  handleAutoplayRejected: () => {
    if (!get().isMuted) set({ isMuted: true });
  },
}));
