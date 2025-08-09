import React, { useEffect, useRef, useState, useMemo } from 'react';
import { SimplePool } from 'nostr-tools/pool';
import type { Event as NostrEvent } from 'nostr-tools/pure';
import { useGesture, useSpring, animated } from '@paiduan/ui';
import { X, MoreVertical } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { trackEvent } from '../utils/analytics';
import ReportModal from './ReportModal';
import { ADMIN_PUBKEYS } from '../utils/admin';
import { useAuth } from '@/hooks/useAuth';
import { getRelays } from '@/lib/nostr';
import { useModqueue } from '@/context/modqueueContext';
import useFocusTrap from '../hooks/useFocusTrap';

interface CommentDrawerProps {
  videoId: string;
  open: boolean;
  onClose: () => void;
  onCountChange?: (count: number) => void;
}

export const CommentDrawer: React.FC<CommentDrawerProps> = ({
  videoId,
  open,
  onClose,
  onCountChange,
}) => {
  const poolRef = useRef(new SimplePool());
  const drawerRef = useRef<HTMLDivElement>(null);
  const { state } = useAuth();
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const [input, setInput] = useState('');
  const [replyTo, setReplyTo] = useState<NostrEvent | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<string>('');
  const modqueue = useModqueue();
  const [extraHiddenIds, setExtraHiddenIds] = useState<Set<string>>(new Set());
  const hiddenIds = useMemo(() => {
    const counts: Record<string, Set<string>> = {};
    const hidden = new Set<string>();
    modqueue
      .filter((r) => r.targetKind === 'comment')
      .forEach((r) => {
        counts[r.targetId] = counts[r.targetId] || new Set();
        counts[r.targetId].add(r.reporterPubKey);
        if (ADMIN_PUBKEYS.includes(r.reporterPubKey)) hidden.add(r.targetId);
      });
    Object.entries(counts).forEach(([id, set]) => {
      if (set.size >= 3) hidden.add(id);
    });
    extraHiddenIds.forEach((id) => hidden.add(id));
    return hidden;
  }, [modqueue, extraHiddenIds]);

  const [{ y }, api] = useSpring(() => ({ y: 100 }));

  useFocusTrap(open, drawerRef);

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
    const sub = (pool as any).subscribeMany(getRelays(), [{ kinds: [1], '#e': [videoId] }], {
      onevent: (ev: any) => {
        setEvents((prev) => {
          if (prev.find((p) => p.id === ev.id)) return prev;
          const next = [...prev, ev].sort((a, b) => a.created_at - b.created_at);
          return next;
        });
      },
    });
    return () => {
      sub.close();
    };
  }, [videoId]);

  // fetch reports to hide comments
  useEffect(() => {
    const pool = poolRef.current as any;
    const sub = pool.subscribeMany(getRelays(), [{ kinds: [9001] }], {
      onevent: (ev: any) => {
        const tag = ev.tags.find((t: string[]) => t[0] === 'e');
        if (tag) setExtraHiddenIds((prev) => new Set(prev).add(tag[1]));
      },
    });
    return () => {
      sub.close();
    };
  }, []);

  // Update count of top level comments
  useEffect(() => {
    const top = events.filter((e) => !e.tags.some((t) => t[0] === 'p'));
    const visible = top.filter((e) => !hiddenIds.has(e.id));
    onCountChange?.(visible.length);
  }, [events, onCountChange, hiddenIds]);

  const send = async () => {
    if (!input.trim()) return;
    if (state.status !== 'ready') {
      toast.error('signer required');
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
        pubkey: state.pubkey,
      };
      const signed = await state.signer.signEvent(event);
      setEvents((prev) => [...prev, signed].sort((a, b) => a.created_at - b.created_at));
      setInput('');
      setReplyTo(null);
      await poolRef.current.publish(getRelays(), signed);
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
  const visibleTop = topLevel.filter((c) => !hiddenIds.has(c.id));
  const visibleReplies = replies.filter((c) => !hiddenIds.has(c.id));
  const visibleMap: Record<string, NostrEvent[]> = {};
  visibleReplies.forEach((ev) => {
    const parent = ev.tags.find((t) => t[0] === 'e' && t[1] !== videoId);
    if (parent) {
      visibleMap[parent[1]] = [...(visibleMap[parent[1]] || []), ev];
    }
  });

  return (
    <animated.div
      ref={drawerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Comments"
      style={{ transform: y.to((py) => `translateY(${py}%)`) }}
      className="fixed inset-x-0 bottom-0 z-50 h-1/2 bg-background-primary text-primary"
      {...bind()}
    >
      <div className="flex items-center justify-between border-b divider p-2">
        <span className="font-semibold">Comments</span>
        <button onClick={onClose} className="p-1 hover:text-accent-primary" aria-label="Close comments">
          <X />
        </button>
      </div>
      <div className="h-[calc(50vh-88px)] overflow-y-auto p-4 space-y-4">
        {visibleTop.map((c) => (
          <div key={c.id}>
            <div className="flex items-start space-x-2">
              <div className="h-8 w-8 rounded-full bg-text-primary/20" />
              <div className="flex-1">
                <div className="text-sm font-semibold">@{c.pubkey.slice(0, 8)}</div>
                <div className="text-sm">{c.content}</div>
                <div className="text-xs text-primary/50">
                  {new Date(c.created_at * 1000).toLocaleString()}
                </div>
                <button className="text-xs text-accent-primary mr-2" onClick={() => setReplyTo(c)}>
                  Reply
                </button>
              </div>
              <div className="relative">
                <button
                  onClick={() => setMenuFor(c.id)}
                  className="p-1 text-primary/50"
                  aria-label="Comment options"
                >
                  <MoreVertical size={16} />
                </button>
                {menuFor === c.id && (
                  <div className="absolute right-0 mt-1 w-24 rounded bg-background-primary p-1 shadow">
                    <button
                      className="block w-full rounded px-2 py-1 text-left text-sm hover:bg-text-primary/10"
                      onClick={() => {
                        setMenuFor(null);
                        setReportTarget(c.id);
                        setReportOpen(true);
                      }}
                    >
                      Report
                    </button>
                  </div>
                )}
              </div>
            </div>
            {visibleMap[c.id]?.map((r) => (
              <div key={r.id} className="mt-2 ml-8 flex items-start space-x-2">
                <div className="h-6 w-6 rounded-full bg-text-primary/20" />
                <div className="flex-1">
                  <div className="text-sm font-semibold">@{r.pubkey.slice(0, 8)}</div>
                  <div className="text-sm">{r.content}</div>
                  <div className="text-xs text-primary/50">
                    {new Date(r.created_at * 1000).toLocaleString()}
                  </div>
                  <button className="text-xs text-accent-primary mr-2" onClick={() => setReplyTo(r)}>
                    Reply
                  </button>
                </div>
              <div className="relative">
                <button
                  onClick={() => setMenuFor(r.id)}
                  className="p-1 text-primary/50"
                  aria-label="Comment options"
                >
                  <MoreVertical size={16} />
                </button>
                  {menuFor === r.id && (
                    <div className="absolute right-0 mt-1 w-24 rounded bg-background-primary p-1 shadow">
                      <button
                        className="block w-full rounded px-2 py-1 text-left text-sm hover:bg-text-primary/10"
                        onClick={() => {
                          setMenuFor(null);
                          setReportTarget(r.id);
                          setReportOpen(true);
                        }}
                      >
                        Report
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="absolute bottom-0 left-0 right-0 border-t divider p-2">
        {replyTo && (
          <div className="mb-1 text-xs text-primary/50">
            Replying to @{replyTo.pubkey.slice(0, 8)}{' '}
            <button onClick={() => setReplyTo(null)} className="underline hover:text-accent-primary">
              cancel
            </button>
          </div>
        )}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a comment"
          className="w-full rounded bg-text-primary/10 p-2 text-sm outline-none"
          disabled={!open}
        />
      </div>
      <ReportModal
        targetId={reportTarget}
        targetKind="comment"
        open={reportOpen}
        onClose={() => setReportOpen(false)}
      />
    </animated.div>
  );
};

export default CommentDrawer;
