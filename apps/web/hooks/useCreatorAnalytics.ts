import { useEffect, useState } from 'react';

export interface CreatorStats {
  totals: {
    views: number;
    zapsSats: number;
    comments: number;
    followerDelta: number;
    revenueAud: number;
  };
  dailySeries: any[];
}

export default function useCreatorAnalytics(pubkey?: string) {
  const [data, setData] = useState<CreatorStats | null>(null);
  const [error, setError] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!pubkey) return;
    setLoading(true);
    fetch(`/api/creator-stats?pubkey=${pubkey}`, { headers: { 'x-pubkey': pubkey } })
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      })
      .then((json) => setData(json))
      .catch((err) => setError(err))
      .finally(() => setLoading(false));

    const es = new EventSource(`/api/creator-stats?pubkey=${pubkey}&stream=1`);
    es.onmessage = (ev) => {
      try {
        setData(JSON.parse(ev.data));
      } catch {
        /* ignore */
      }
    };
    return () => {
      es.close();
    };
  }, [pubkey]);

  return { data, error, loading };
}
