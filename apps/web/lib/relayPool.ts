import { SimplePool } from 'nostr-tools/pool';
import { normalizeURL } from 'nostr-tools/utils';

/**
 * Shared, reference-counted pool of relay connections.
 * Ensures only one WebSocket per relay URL is created and
 * closed when no longer referenced.
 */
class RelayPool extends SimplePool {
  private refs: Map<string, number> = new Map();

  async ensureRelay(url: string, params?: any) {
    const norm = normalizeURL(url);
    const relay = await super.ensureRelay(norm, params);
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
