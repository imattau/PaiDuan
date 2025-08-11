'use client';
import { useEffect, useState } from 'react';

const cache = new Map<string, string>();

export function useAvatar(pubkey?: string) {
  const [url, setUrl] = useState('/avatar.svg');

  useEffect(() => {
    if (!pubkey) return;
    if (cache.has(pubkey)) {
      setUrl(cache.get(pubkey)!);
      return;
    }
    const apiUrl = `/api/avatar/${pubkey}`;
    let cancelled = false;
    fetch(apiUrl)
      .then((res) => {
        const finalUrl = res.ok ? apiUrl : '/avatar.svg';
        cache.set(pubkey, finalUrl);
        if (!cancelled) setUrl(finalUrl);
      })
      .catch(() => {
        cache.set(pubkey, '/avatar.svg');
        if (!cancelled) setUrl('/avatar.svg');
      });
    return () => {
      cancelled = true;
    };
  }, [pubkey]);

  return url;
}
