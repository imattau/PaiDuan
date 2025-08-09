import fs from 'fs';

export interface Event {
  kind: number;
  pubkey: string;
  created_at: number; // unix seconds
  amount?: number;
  content?: string;
  tags?: string[][];
}

export interface Totals {
  views: number;
  zapsSats: number;
  comments: number;
  followerDelta: number;
  revenueAud: number;
}

export interface DailyEntry extends Totals {
  date: string;
}

export interface AggregatedStats {
  totals: Totals;
  dailySeries: DailyEntry[];
}

const DEFAULT_RATE = Number(process.env.SAT_TO_AUD || 0.0005);

export class CreatorStatsStore {
  constructor(private filePath: string) {}

  read(): Record<string, AggregatedStats> {
    try {
      const raw = fs.readFileSync(this.filePath);
      return JSON.parse(raw.toString('utf8'));
    } catch {
      return {};
    }
  }

  write(data: Record<string, AggregatedStats>): void {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  aggregate(events: Event[], rate: number = DEFAULT_RATE): AggregatedStats {
    const daily: Record<string, Totals> = {};
    const totals: Totals = {
      views: 0,
      zapsSats: 0,
      comments: 0,
      followerDelta: 0,
      revenueAud: 0,
    };

    for (const ev of events) {
      const date = new Date(ev.created_at * 1000).toISOString().slice(0, 10);
      if (!daily[date]) {
        daily[date] = {
          views: 0,
          zapsSats: 0,
          comments: 0,
          followerDelta: 0,
          revenueAud: 0,
        };
      }
      const d = daily[date];
      switch (ev.kind) {
        case 30023:
          totals.views++;
          d.views++;
          break;
        case 9735: {
          const amt =
            ev.amount ||
            parseInt(ev.tags?.find((t) => t[0] === 'amount')?.[1] || '0', 10) ||
            0;
          totals.zapsSats += amt;
          d.zapsSats += amt;
          break;
        }
        case 9736: {
          try {
            const json = JSON.parse(ev.content || '{}');
            const sats = Array.isArray(json.splits)
              ? json.splits.reduce((s: number, sp: any) => s + Number(sp.sats || 0), 0)
              : Number(json.sats || 0);
            const aud = sats * rate;
            totals.revenueAud += aud;
            d.revenueAud += aud;
          } catch {
            /* ignore */
          }
          break;
        }
        case 1:
          totals.comments++;
          d.comments++;
          break;
        case 3:
          totals.followerDelta++;
          d.followerDelta++;
          break;
      }
    }

    const dailySeries: DailyEntry[] = Object.keys(daily)
      .sort()
      .map((date) => ({ date, ...daily[date] }));

    return { totals, dailySeries };
  }
}
