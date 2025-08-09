import { SimplePool } from 'nostr-tools/pool';
import { normalizeURL } from 'nostr-tools/utils';

const MAX_DELAY = 30_000; // 30s cap
const MAX_RETRIES = 5;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Shared, reference-counted pool of relay connections.
 * Ensures only one WebSocket per relay URL is created and
 * closed when no longer referenced.
 */
export class RelayPool extends SimplePool {
  private refs: Map<string, number> = new Map();
  private infos: Map<string, any> = new Map();
  private subCounts: Map<string, number> = new Map();
  private rateState: Map<string, { count: number; reset: number }> = new Map();

  private async fetchInfo(url: string) {
    try {
      const httpUrl = url.replace(/^ws(s)?:\/\//, 'http$1://');
      const res = await fetch(httpUrl, {
        headers: { Accept: 'application/nostr+json' },
      });
      if (!res.ok) return {};
      return await res.json();
    } catch {
      return {};
    }
  }

  private async connectWithRetry(url: string, params?: any) {
    let attempt = 0;
    while (true) {
      try {
        return await super.ensureRelay(url, params);
      } catch (err) {
        attempt += 1;
        if (attempt > MAX_RETRIES) {
          super.close([url]);
          throw err;
        }
        const backoff = Math.min(MAX_DELAY, 2 ** attempt * 1000);
        const jitter = Math.random() * 1000;
        await sleep(backoff + jitter);
      }
    }
  }

  private async rateLimit(url: string) {
    const info = this.infos.get(url);
    const max = info?.limitation?.max_message_rate;
    if (!max) return;
    const now = Date.now();
    let state = this.rateState.get(url);
    if (!state || now > state.reset) {
      state = { count: 0, reset: now + 1000 };
    }
    if (state.count >= max) {
      await sleep(state.reset - now);
      state = { count: 0, reset: Date.now() + 1000 };
    }
    state.count += 1;
    this.rateState.set(url, state);
  }

  async ensureRelay(url: string, params?: any) {
    const norm = normalizeURL(url);
    const relay = await this.connectWithRetry(norm, params);

    if (!this.infos.has(norm)) {
      const info = await this.fetchInfo(norm);
      this.infos.set(norm, info);
      this.subCounts.set(norm, 0);

      const origSend = relay.send.bind(relay);
      relay.send = async (msg: string) => {
        await this.rateLimit(norm);
        return origSend(msg);
      };

      const origPrepare = relay.prepareSubscription.bind(relay);
      relay.prepareSubscription = (filters: any, params?: any) => {
        const maxSubs = this.infos.get(norm)?.limitation?.max_subscriptions;
        const curr = this.subCounts.get(norm) ?? 0;
        if (maxSubs !== undefined && curr >= maxSubs) {
          return { fire: () => {}, close: () => {} } as any;
        }
        const sub = origPrepare(filters, params);
        this.subCounts.set(norm, curr + 1);
        const origClose = sub.close.bind(sub);
        sub.close = (reason?: string) => {
          origClose(reason);
          const c = this.subCounts.get(norm) ?? 1;
          this.subCounts.set(norm, Math.max(0, c - 1));
        };
        return sub;
      };
    }

    this.refs.set(norm, (this.refs.get(norm) ?? 0) + 1);
    return relay;
  }

  private release(url: string) {
    const norm = normalizeURL(url);
    const count = this.refs.get(norm);
    if (!count) return;
    if (count <= 1) {
      this.refs.delete(norm);
      super.close([norm]);
    } else {
      this.refs.set(norm, count - 1);
    }
  }

  async get(relayUrl: string): Promise<WebSocket> {
    const relay = await this.ensureRelay(relayUrl);
    // @ts-ignore accessing underlying websocket implementation
    return (relay as any).ws as WebSocket;
  }

  async onMessage(relayUrl: string, handler: (ev: MessageEvent) => void) {
    const ws = await this.get(relayUrl);
    ws.addEventListener('message', handler);
    return () => {
      ws.removeEventListener('message', handler);
      this.release(relayUrl);
    };
  }

  close(relays: string[]) {
    relays.forEach((url) => this.release(url));
  }
}

const pool = new RelayPool();

export const get = (relayUrl: string) => pool.get(relayUrl);
export const onMessage = (
  relayUrl: string,
  handler: (ev: MessageEvent) => void,
) => pool.onMessage(relayUrl, handler);

export default pool;
