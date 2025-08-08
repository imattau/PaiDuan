import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type FollowingState = {
  following: string[];
  follow: (pubkey: string) => void;
  unfollow: (pubkey: string) => void;
};

export const useFollowingStore = create<FollowingState>()(
  persist(
    (set) => ({
      following: [],
      follow: (pubkey) =>
        set((state) =>
          state.following.includes(pubkey)
            ? state
            : { following: [...state.following, pubkey] },
        ),
      unfollow: (pubkey) =>
        set((state) => ({
          following: state.following.filter((p) => p !== pubkey),
        })),
    }),
    {
      name: 'following',
    },
  ),
);

export const follow = (pubkey: string) =>
  useFollowingStore.getState().follow(pubkey);
export const unfollow = (pubkey: string) =>
  useFollowingStore.getState().unfollow(pubkey);
export const following = () => useFollowingStore.getState().following;
