import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useSettings } from '@/store/settings';

type S = {
  selectedVideoId?: string;
  selectedVideoAuthor?: string;
  setSelectedVideo: (id?: string, authorPubkey?: string) => void;
  filterAuthor?: string;
  setFilterAuthor: (pubkey?: string) => void;
  lastIndex?: number;
  lastCursor?: string;
  lastCursorTime?: number;
  setLastPosition: (index: number, cursor: string, cursorTime: number) => void;
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
      lastCursorTime: undefined,
      setLastPosition: (index, cursor, cursorTime) =>
        set({ lastIndex: index, lastCursor: cursor, lastCursorTime: cursorTime }),
    }),
    {
      name: 'feed-selection',
      partialize: (state) => {
        const { enableFeedResume } = useSettings.getState();
        return {
          selectedVideoId: state.selectedVideoId,
          selectedVideoAuthor: state.selectedVideoAuthor,
          ...(enableFeedResume
            ? {
                lastIndex: state.lastIndex,
                lastCursor: state.lastCursor,
                lastCursorTime: state.lastCursorTime,
              }
            : {}),
        };
      },
    },
  ),
);
