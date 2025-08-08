import { useEffect, useState } from 'react';

const STORAGE_KEY = 'following';

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

export function follow(pubkey: string) {
  const current = readLocal();
  if (!current.includes(pubkey)) {
    current.push(pubkey);
    writeLocal(current);
  }
}

export function unfollow(pubkey: string) {
  const current = readLocal().filter((p) => p !== pubkey);
  writeLocal(current);
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
