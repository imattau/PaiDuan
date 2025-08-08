import { describe, it, expect } from 'vitest';
import { CreatorStatsStore, Event } from '../apps/web/lib/creatorStatsStore';

describe('CreatorStatsStore.aggregate', () => {
  it('computes totals and daily series', () => {
    const ts = 1_700_000_000; // arbitrary timestamp
    const events: Event[] = [
      { kind: 30023, pubkey: 'a', created_at: ts },
      { kind: 9735, pubkey: 'a', created_at: ts, amount: 10 },
      {
        kind: 9736,
        pubkey: 'a',
        created_at: ts,
        content: JSON.stringify({ splits: [{ sats: 20 }] }),
      },
      { kind: 1, pubkey: 'a', created_at: ts },
      { kind: 3, pubkey: 'a', created_at: ts },
    ];
    const store = new CreatorStatsStore('');
    const stats = store.aggregate(events, 0.001);
    expect(stats.totals.views).toBe(1);
    expect(stats.totals.zapsSats).toBe(10);
    expect(stats.totals.comments).toBe(1);
    expect(stats.totals.followerDelta).toBe(1);
    expect(stats.totals.revenueAud).toBeCloseTo(0.02);
    expect(stats.dailySeries).toHaveLength(1);
  });
});
