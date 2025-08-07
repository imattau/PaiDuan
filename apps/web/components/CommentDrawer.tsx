import React, { useEffect, useRef, useState } from 'react';
import { SimplePool, Event as NostrEvent } from 'nostr-tools';
import { useGesture, useSpring, animated } from '@paiduan/ui';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { trackEvent } from '../utils/analytics';

interface CommentDrawerProps {
  videoId: string;
  open: boolean;
  onClose: () => void;
  onCountChange?: (count: number) => void;
}

const relays = ['wss://relay.damus.io', 'wss://nos.lol'];

export const CommentDrawer: React.FC<CommentDrawerProps> = ({
  videoId,
  open,
  onClose,
  onCountChange,
}) => {
  const poolRef = useRef(new SimplePool());
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const [input, setInput] = useState('');
  const [replyTo, setReplyTo] = useState<NostrEvent | null>(null);

  const [{ y }, api] = useSpring(() => ({ y: 100 }));

  useEffect(() => {
    api.start({ y: open ? 0 : 100 });
  }, [open]);

  const bind = useGesture(
    {
      onDrag: ({ movement: [, my], last }) => {
        if (!open) return;
        const clamped = Math.max(my, 0);
        api.start({ y: clamped });
        if (last) {
          if (clamped > 80) {
            onClose();
            api.start({ y: 100 });
          } else {
            api.start({ y: 0 });
          }
        }
      },
    },
    { drag: { from: () => [0, y.get()] } as any },
  );

  // Subscribe to comments
  useEffect(() => {
    const pool = poolRef.current;
    const sub = (pool as any).sub(relays, [{ kinds: [1], '#e': [videoId] }]);
    sub.on('event', (ev: any) => {
      setEvents((prev) => {
        if (prev.find((p) => p.id === ev.id)) return prev;
        const next = [...prev, ev].sort((a, b) => a.created_at - b.created_at);
        return next;
      });
    });
    return () => {
      sub.unsub();
    };
  }, [videoId]);

  // Update count of top level comments
  useEffect(() => {
    const top = events.filter((e) => !e.tags.some((t) => t[0] === 'p'));
    onCountChange?.(top.length);
  }, [events, onCountChange]);

  const send = async () => {
    if (!input.trim()) return;
    const nostr = (typeof window !== 'undefined' && (window as any).nostr) || null;
    if (!nostr) {
      toast.error('nostr extension required');
      return;
    }
    try {
      const tags: string[][] = [['e', videoId]];
      if (replyTo) {
        tags.push(['e', replyTo.id]);
        tags.push(['p', replyTo.pubkey]);
      }
      const event: any = {
        kind: 1,
        created_at: Math.floor(Date.now() / 1000),
        tags,
        content: input,
      };
      const signed = await nostr.signEvent(event);
      setEvents((prev) => [...prev, signed].sort((a, b) => a.created_at - b.created_at));
      setInput('');
      setReplyTo(null);
      await poolRef.current.publish(relays, signed);
      toast.success('Comment sent');
      trackEvent('comment_send');
    } catch (err) {
      console.error(err);
      toast.error('Failed to send');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      send();
    }
  };

  const topLevel = events.filter((e) => !e.tags.some((t) => t[0] === 'p'));
  const replies = events.filter((e) => e.tags.some((t) => t[0] === 'p'));
  const repliesMap: Record<string, NostrEvent[]> = {};
  replies.forEach((ev) => {
    const parent = ev.tags.find((t) => t[0] === 'e' && t[1] !== videoId);
    if (parent) {
      repliesMap[parent[1]] = [...(repliesMap[parent[1]] || []), ev];
    }
  });

  return (
    <animated.div
      style={{ transform: y.to((py) => `translateY(${py}%)`) }}
      className="fixed inset-x-0 bottom-0 z-50 h-1/2 bg-background text-foreground"
      {...bind()}
    >
      <div className="flex items-center justify-between border-b border-foreground/10 p-2">
        <span className="font-semibold">Comments</span>
        <button onClick={onClose} className="p-1 hover:text-accent">
          <X />
        </button>
      </div>
      <div className="h-[calc(50vh-88px)] overflow-y-auto p-4 space-y-4">
        {topLevel.map((c) => (
          <div key={c.id}>
            <div className="flex items-start space-x-2">
              <div className="h-8 w-8 rounded-full bg-foreground/20" />
              <div>
                <div className="text-sm font-semibold">@{c.pubkey.slice(0, 8)}</div>
                <div className="text-sm">{c.content}</div>
                <div className="text-xs text-foreground/50">
                  {new Date(c.created_at * 1000).toLocaleString()}
                </div>
                <button className="text-xs text-accent" onClick={() => setReplyTo(c)}>
                  Reply
                </button>
              </div>
            </div>
            {repliesMap[c.id]?.map((r) => (
              <div key={r.id} className="mt-2 ml-8 flex items-start space-x-2">
                <div className="h-6 w-6 rounded-full bg-foreground/20" />
                <div>
                  <div className="text-sm font-semibold">@{r.pubkey.slice(0, 8)}</div>
                  <div className="text-sm">{r.content}</div>
                  <div className="text-xs text-foreground/50">
                    {new Date(r.created_at * 1000).toLocaleString()}
                  </div>
                  <button className="text-xs text-accent" onClick={() => setReplyTo(r)}>
                    Reply
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="absolute bottom-0 left-0 right-0 border-t border-foreground/10 p-2">
        {replyTo && (
          <div className="mb-1 text-xs text-foreground/50">
            Replying to @{replyTo.pubkey.slice(0, 8)}{' '}
            <button onClick={() => setReplyTo(null)} className="underline hover:text-accent">
              cancel
            </button>
          </div>
        )}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a comment"
          className="w-full rounded bg-foreground/10 p-2 text-sm outline-none"
          disabled={!open}
        />
      </div>
    </animated.div>
  );
};

export default CommentDrawer;
