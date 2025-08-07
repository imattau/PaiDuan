import { useEffect, useState } from 'react';

const STORAGE_KEY = 'following';
const FOLLOWERS_PREFIX = 'followers-';

function readLocal(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(list: string[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

function followersKey(pubkey: string) {
  return `${FOLLOWERS_PREFIX}${pubkey}`;
}

function readFollowers(pubkey: string): number {
  if (typeof window === 'undefined') return 0;
  const raw = window.localStorage.getItem(followersKey(pubkey));
  const n = raw ? parseInt(raw, 10) : 0;
  return isNaN(n) ? 0 : n;
}

function writeFollowers(pubkey: string, count: number) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(followersKey(pubkey), String(count));
  } catch {
    /* ignore */
  }
}

function updateFollowers(pubkey: string, delta: number) {
  const next = Math.max(0, readFollowers(pubkey) + delta);
  writeFollowers(pubkey, next);
}

export function getFollowers(pubkey: string): number {
  return readFollowers(pubkey);
}

export function follow(pubkey: string) {
  const current = readLocal();
  if (!current.includes(pubkey)) {
    current.push(pubkey);
    writeLocal(current);
    updateFollowers(pubkey, 1);
  }
}

export function unfollow(pubkey: string) {
  const current = readLocal().filter((p) => p !== pubkey);
  writeLocal(current);
  updateFollowers(pubkey, -1);
}

export function useFollowing() {
  const [following, setFollowing] = useState<string[]>([]);

  useEffect(() => {
    setFollowing(readLocal());
  }, []);

  const add = (pubkey: string) => {
    follow(pubkey);
    setFollowing(readLocal());
  };

  const remove = (pubkey: string) => {
    unfollow(pubkey);
    setFollowing(readLocal());
  };

  return { following, follow: add, unfollow: remove };
}

export default useFollowing;
