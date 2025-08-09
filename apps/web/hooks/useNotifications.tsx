import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import type { Event as NostrEvent } from 'nostr-tools/pure';
import pool from '@/lib/relayPool';
import * as Toast from '@radix-ui/react-toast';
import { getRelays } from '@/lib/nostr';
import { Workbox } from 'workbox-window';

export interface Notification {
  id: string;
  type: 'zap' | 'comment';
  from: string;
  noteId: string;
  amount?: number;
  text?: string;
  created_at: number;
}

interface NotificationContextValue {
  notifications: Notification[]; // unseen notifications
  unreadCount: number;
  markAllAsRead: () => void;
  markAsRead: (id: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  notify: (message: string) => void;
}

const NotificationsContext = createContext<NotificationContextValue | null>(null);

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function readStorage(): Notification[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem('unseen-notifications');
    return raw ? (JSON.parse(raw) as Notification[]) : [];
  } catch {
    return [];
  }
}

function writeStorage(list: Notification[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem('unseen-notifications', JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export async function requestNotificationPermission() {
  if (typeof window === 'undefined') return;
  if (process.env.NODE_ENV !== 'production') return;
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const permission =
      Notification.permission === 'default'
        ? await Notification.requestPermission()
        : Notification.permission;
    if (permission !== 'granted') return;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) return;
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });
      await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub }),
      });
    }
  } catch (err) {
    console.error('push setup failed', err);
  }
}

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>(readStorage);
  const [open, setOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const notify = useCallback((message: string) => {
    setToastOpen(false);
    setToastMessage(message);
    setToastOpen(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;

    const wb = new Workbox('/sw.js');
    wb.addEventListener('waiting', () => {
      notify('A new version is available. Click to reload.');
      const handler = () => {
        wb.addEventListener('controlling', () => window.location.reload());
        wb.messageSkipWaiting();
      };
      window.addEventListener('click', handler, { once: true });
    });
    wb.register();
  }, [notify]);

  // keep refs to avoid stale closures
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const pushNotification = (n: Notification) => {
    setNotifications((prev) => {
      if (prev.find((p) => p.id === n.id)) return prev; // avoid duplicates
      const next = [n, ...prev].sort((a, b) => b.created_at - a.created_at);
      writeStorage(next);
      if (!openRef.current) {
        const summary =
          n.type === 'zap'
            ? `⚡ ${n.from.slice(0, 8)} zapped you ${n.amount ?? 0} sats`
            : `💬 ${n.from.slice(0, 8)} replied: ${n.text ?? ''}`;
        notify(summary);
      }
      if (typeof window !== 'undefined') {
        fetch('/api/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notification: {
              title: n.type === 'zap' ? 'New zap' : 'New comment',
              body:
                n.type === 'zap'
                  ? `${n.from.slice(0, 8)} zapped you ${n.amount ?? 0} sats`
                  : `${n.from.slice(0, 8)} replied: ${n.text ?? ''}`,
              data: { url: `/v/${n.noteId}` },
            },
          }),
        }).catch(() => {
          /* ignore */
        });
      }
      return next;
    });
  };

  useEffect(() => {
    writeStorage(notifications);
  }, [notifications]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const nostr = (window as any).nostr;
    if (!nostr) return;
    let zapSub: { close: () => void } | null = null;
    let commentSub: { close: () => void } | null = null;

    (async () => {
      try {
        const pubkey = await nostr.getPublicKey();
        const relays = getRelays();

        // fetch my video ids (kind 30023)
        let myVideos: NostrEvent[] = [];
        try {
          myVideos = await pool.list(relays, [{ kinds: [30023], authors: [pubkey] }]);
        } catch {
          /* ignore */
        }
        const myVideoIds = myVideos.map((v) => v.id);

        // subscribe to zap receipts
        zapSub = pool.subscribeMany(relays, [{ kinds: [9735], '#p': [pubkey] }], {
          onevent: (ev: NostrEvent) => {
            const eTag = ev.tags.find((t) => t[0] === 'e');
            const amt = ev.tags.find((t) => t[0] === 'amount');
            pushNotification({
              id: ev.id,
              type: 'zap',
              from: ev.pubkey,
              amount: amt ? Math.round(parseInt(amt[1] || '0', 10) / 1000) : undefined,
              noteId: eTag ? eTag[1] : '',
              created_at: ev.created_at,
            });
          },
        });

        // subscribe to comments on my videos
        if (myVideoIds.length > 0) {
          commentSub = pool.subscribeMany(relays, [{ kinds: [1], '#e': myVideoIds }], {
            onevent: (ev: NostrEvent) => {
              const eTag = ev.tags.find((t) => t[0] === 'e');
              pushNotification({
                id: ev.id,
                type: 'comment',
                from: ev.pubkey,
                text: ev.content.slice(0, 100),
                noteId: eTag ? eTag[1] : '',
                created_at: ev.created_at,
              });
            },
          });
        }
      } catch {
        /* ignore */
      }
    })();

    return () => {
      zapSub?.close();
      commentSub?.close();
    };
  }, []);

  const markAllAsRead = () => {
    setNotifications([]);
    writeStorage([]);
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) => {
      const next = prev.filter((n) => n.id !== id);
      writeStorage(next);
      return next;
    });
  };

  const value: NotificationContextValue = {
    notifications,
    unreadCount: notifications.length,
    markAllAsRead,
    markAsRead,
    open,
    setOpen,
    notify,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
      <Toast.Root
        open={toastOpen}
        onOpenChange={setToastOpen}
        duration={5000}
        onClick={() => setOpen(true)}
        className="cursor-pointer rounded-md bg-gray-800 px-3 py-2 text-sm text-white shadow"
      >
        <Toast.Title>{toastMessage}</Toast.Title>
      </Toast.Root>
    </NotificationsContext.Provider>
  );
};

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}

export default useNotifications;
