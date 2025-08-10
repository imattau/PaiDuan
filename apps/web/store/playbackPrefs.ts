import { create } from 'zustand';

export type PlaybackPrefsState = {
  isMuted: boolean;
  setMuted: (muted: boolean) => void;
};

export const usePlaybackPrefs = create<PlaybackPrefsState>((set) => ({
  isMuted: true,
  setMuted: (isMuted) => set({ isMuted }),
}));
