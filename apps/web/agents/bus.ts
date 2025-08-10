export type AppEvent =
  | { type: 'upload.progress'; id: string; pct: number }
  | { type: 'upload.complete'; id: string }
  | { type: 'nostr.published'; id?: string }
  | { type: 'nostr.error'; error: string };

export type Unsub = () => void;

class EventBus {
  private listeners: {
    [K in AppEvent['type']]?: Array<(e: Extract<AppEvent, { type: K }>) => void>;
  } = {};

  emit<E extends AppEvent>(event: E): void {
    this.listeners[event.type]?.forEach((cb) => cb(event as any));
  }

  on<T extends AppEvent['type']>(
    type: T,
    cb: (event: Extract<AppEvent, { type: T }>) => void,
  ): Unsub {
    (this.listeners[type] ??= []).push(cb as any);
    return () => {
      const arr = this.listeners[type];
      if (!arr) return;
      this.listeners[type] = arr.filter((fn) => fn !== cb);
    };
  }
}

export const bus = new EventBus();
