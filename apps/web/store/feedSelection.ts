import { create } from 'zustand';

type S = {
  selectedVideoId?: string;
  setSelectedVideoId: (id?: string) => void;
  filterAuthor?: string;
  setFilterAuthor: (pubkey?: string) => void;
};
export const useFeedSelection = create<S>((set) => ({
  selectedVideoId: undefined,
  setSelectedVideoId: (id) => set({ selectedVideoId: id }),
  filterAuthor: undefined,
  setFilterAuthor: (pubkey) => set({ filterAuthor: pubkey }),
}));
