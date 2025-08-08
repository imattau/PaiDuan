import { useFollowingStore } from '@/store/following';

export function useFollowing() {
  return useFollowingStore();
}

export default useFollowing;
