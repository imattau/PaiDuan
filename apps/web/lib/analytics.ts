import { setTimeout as delay } from 'timers/promises';

const DEFAULT_URLS = (process.env.ANALYTICS_URLS || 'https://stats.paiduan.app/api/event')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export class AnalyticsService {
  constructor(private urls: string[] = DEFAULT_URLS, private retries = 3) {}

  async post(body: unknown, headers: Record<string, string> = {}): Promise<void> {
    for (const url of this.urls) {
      let attempt = 0;
      while (attempt < this.retries) {
        try {
          await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify(body),
          });
          console.log(`Analytics event sent to ${url}`);
          break;
        } catch (err) {
          attempt++;
          console.error(`Analytics POST to ${url} failed (attempt ${attempt})`, err);
          if (attempt >= this.retries) {
            console.error(`Giving up on analytics POST to ${url}`);
            break;
          }
          await delay(500);
        }
      }
    }
  }
}

export const analyticsService = new AnalyticsService();
