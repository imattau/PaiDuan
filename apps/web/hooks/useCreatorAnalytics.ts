"use client";

import { useEffect, useState } from 'react';
import type {
  AggregatedStats as BaseStats,
  DailyEntry as BaseDailyEntry,
} from '../lib/creatorStatsStore';

export type DailyStat = BaseDailyEntry & Record<string, unknown>;
export interface CreatorStats extends BaseStats {
  dailySeries: DailyStat[];
}

export default function useCreatorAnalytics(pubkey?: string) {
  const [data, setData] = useState<CreatorStats | null>(null);
  const [error, setError] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [offline, setOffline] = useState<boolean>(
    typeof navigator !== 'undefined' ? !navigator.onLine : false,
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    function handleOnline() {
      setOffline(false);
    }
    function handleOffline() {
      setOffline(true);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!pubkey) return;
    let es: EventSource | null = null;

    if (offline) {
      setLoading(false);
      if (typeof window !== 'undefined') {
        try {
          const raw = window.localStorage.getItem(`creator-analytics:${pubkey}`);
          if (raw) setData(JSON.parse(raw));
        } catch {
          /* ignore */
        }
      }
      return;
    }

    setLoading(true);
    setError(null);
    fetch(`/api/creator-stats?pubkey=${pubkey}`, { headers: { 'x-pubkey': pubkey } })
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      })
      .then((json: CreatorStats) => {
        setData(json);
        if (typeof window !== 'undefined') {
          try {
            window.localStorage.setItem(
              `creator-analytics:${pubkey}`,
              JSON.stringify(json),
            );
          } catch {
            /* ignore */
          }
        }
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false));

    es = new EventSource(`/api/creator-stats?pubkey=${pubkey}&stream=1`);
    es.onmessage = (ev) => {
      try {
        const json = JSON.parse(ev.data) as CreatorStats;
        setData(json);
        if (typeof window !== 'undefined') {
          try {
            window.localStorage.setItem(
              `creator-analytics:${pubkey}`,
              JSON.stringify(json),
            );
          } catch {
            /* ignore */
          }
        }
      } catch {
        /* ignore */
      }
    };
    es.onerror = () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setOffline(true);
      }
    };

    return () => {
      es?.close();
    };
  }, [pubkey, offline]);

  return { data, error, loading, offline };
}
