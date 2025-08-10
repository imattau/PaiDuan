import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type S = {
  selectedVideoId?: string;
  selectedVideoAuthor?: string;
  setSelectedVideo: (id?: string, authorPubkey?: string) => void;
  filterAuthor?: string;
  setFilterAuthor: (pubkey?: string) => void;
};
export const useFeedSelection = create<S>()(
  persist(
    (set) => ({
      selectedVideoId: undefined,
      selectedVideoAuthor: undefined,
      setSelectedVideo: (id, authorPubkey) =>
        set((state) => {
          if (state.selectedVideoId === id && state.selectedVideoAuthor === authorPubkey) {
            return state;
          }
          return { selectedVideoId: id, selectedVideoAuthor: authorPubkey };
        }),
      filterAuthor: undefined,
      setFilterAuthor: (pubkey) => set({ filterAuthor: pubkey }),
    }),
    {
      name: 'feed-selection',
      partialize: (state) => ({
        selectedVideoId: state.selectedVideoId,
        selectedVideoAuthor: state.selectedVideoAuthor,
      }),
    },
  ),
);
