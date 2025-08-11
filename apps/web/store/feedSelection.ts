import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type S = {
  selectedVideoId?: string;
  selectedVideoAuthor?: string;
  setSelectedVideo: (id?: string, authorPubkey?: string) => void;
  filterAuthor?: string;
  setFilterAuthor: (pubkey?: string) => void;
  lastIndex?: number;
  lastCursor?: string;
  lastTimestamp?: number;
  setLastPosition: (index: number, cursor: string, timestamp: number) => void;
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
      lastIndex: undefined,
      lastCursor: undefined,
      lastTimestamp: undefined,
      setLastPosition: (index, cursor, timestamp) =>
        set({ lastIndex: index, lastCursor: cursor, lastTimestamp: timestamp }),
    }),
    {
      name: 'feed-selection',
      partialize: (state) => ({
        selectedVideoId: state.selectedVideoId,
        selectedVideoAuthor: state.selectedVideoAuthor,
        lastIndex: state.lastIndex,
        lastCursor: state.lastCursor,
        lastTimestamp: state.lastTimestamp,
      }),
    },
  ),
);
