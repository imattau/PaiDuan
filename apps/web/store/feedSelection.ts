import { create } from 'zustand';

type S = {
  selectedVideoId?: string;
  selectedVideoAuthor?: string;
  setSelectedVideo: (id?: string, authorPubkey?: string) => void;
  filterAuthor?: string;
  setFilterAuthor: (pubkey?: string) => void;
};
export const useFeedSelection = create<S>((set) => ({
  selectedVideoId: undefined,
  selectedVideoAuthor: undefined,
  setSelectedVideo: (id, authorPubkey) =>
    set({ selectedVideoId: id, selectedVideoAuthor: authorPubkey }),
  filterAuthor: undefined,
  setFilterAuthor: (pubkey) => set({ filterAuthor: pubkey }),
}));
