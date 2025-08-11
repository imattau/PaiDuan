import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SettingsState = {
  enableFeedResume: boolean;
  setEnableFeedResume: (enabled: boolean) => void;
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      enableFeedResume: false,
      setEnableFeedResume: (enableFeedResume) => set({ enableFeedResume }),
    }),
    {
      name: 'settings',
      partialize: (state) => ({ enableFeedResume: state.enableFeedResume }),
    },
  ),
);

export default useSettings;
