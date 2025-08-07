import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Event as NostrEvent } from 'nostr-tools';
import pool from './pool';
import { toast } from 'react-hot-toast';

const relays = ['wss://relay.damus.io', 'wss://nos.lol'];

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
}

const NotificationsContext = createContext<NotificationContextValue | null>(null);

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

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>(readStorage);
  const [open, setOpen] = useState(false);

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
        toast.custom((t) => (
          <div
            onClick={() => {
              setOpen(true);
              toast.dismiss(t.id);
            }}
            className="cursor-pointer px-2"
          >
            {summary}
          </div>
        ));
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
    let zapSub: { unsub: () => void } | null = null;
    let commentSub: { unsub: () => void } | null = null;

    (async () => {
      try {
        const pubkey = await nostr.getPublicKey();

        // fetch my video ids (kind 30023)
        let myVideos: NostrEvent[] = [];
        try {
          myVideos = await pool.list(relays, [{ kinds: [30023], authors: [pubkey] }]);
        } catch {
          /* ignore */
        }
        const myVideoIds = myVideos.map((v) => v.id);

        // subscribe to zap receipts
        zapSub = pool.sub(relays, [{ kinds: [9735], '#p': [pubkey] }]);
        zapSub.on('event', (ev: NostrEvent) => {
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
        });

        // subscribe to comments on my videos
        if (myVideoIds.length > 0) {
          commentSub = pool.sub(relays, [{ kinds: [1], '#e': myVideoIds }]);
          commentSub.on('event', (ev: NostrEvent) => {
            const eTag = ev.tags.find((t) => t[0] === 'e');
            pushNotification({
              id: ev.id,
              type: 'comment',
              from: ev.pubkey,
              text: ev.content.slice(0, 100),
              noteId: eTag ? eTag[1] : '',
              created_at: ev.created_at,
            });
          });
        }
      } catch {
        /* ignore */
      }
    })();

    return () => {
      zapSub?.unsub();
      commentSub?.unsub();
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
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}

export default useNotifications;
