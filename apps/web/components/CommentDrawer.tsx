import React, { useEffect, useState, useMemo, useRef } from 'react';
import type { Event as NostrEvent } from 'nostr-tools/pure';
import { X, MoreVertical } from 'lucide-react';
import { toast } from 'react-hot-toast';
import analytics from '../utils/analytics';
import ReportModal from './ReportModal';
import { ADMIN_PUBKEYS } from '../utils/admin';
import { useModqueue } from '@/context/modqueueContext';
import Overlay from './ui/Overlay';
import useComments from '@/hooks/useComments';

interface CommentDrawerContentProps {
  videoId: string;
  onClose?: () => void;
  onCountChange?: (count: number) => void;
}

function CommentDrawerContent({ videoId, onClose, onCountChange }: CommentDrawerContentProps) {
  const { comments, hiddenIds: agentHiddenIds, send, canSend } = useComments(videoId);
  const [input, setInput] = useState('');
  const [replyTo, setReplyTo] = useState<NostrEvent | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const modqueue = useModqueue();
  const hiddenIds = useMemo(() => {
    const counts: Record<string, Set<string>> = {};
    const hidden = new Set<string>(agentHiddenIds);
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
    return hidden;
  }, [modqueue, agentHiddenIds]);

  useEffect(() => {
    const top = comments.filter((e) => !e.tags.some((t) => t[0] === 'p'));
    const visible = top.filter((e) => !hiddenIds.has(e.id));
    onCountChange?.(visible.length);
  }, [comments, onCountChange, hiddenIds]);

  const sendComment = async () => {
    if (!input.trim()) return;
    if (!canSend) {
      toast.error('signer required');
      return;
    }
    try {
      await send(input, replyTo ?? undefined);
      setInput('');
      setReplyTo(null);
      toast.success('Comment sent');
      analytics.trackEvent('comment_send');
    } catch (err) {
      console.error(err);
      toast.error('Failed to send');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendComment();
    }
  };

  const topLevel = comments.filter((e) => !e.tags.some((t) => t[0] === 'p'));
  const replies = comments.filter((e) => e.tags.some((t) => t[0] === 'p'));
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
    <>
      <div className="flex items-center justify-between border-b divider p-2">
        <span className="font-semibold">Comments</span>
        <button
          className="p-1 hover:text-accent-primary"
          aria-label="Close comments"
          onClick={() => {
            Overlay.close();
            onClose?.();
          }}
        >
          <X />
        </button>
      </div>
      <div className="h-[calc(50vh-88px)] overflow-y-auto overscroll-contain p-4 space-y-4">
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
                        ReportModal({ targetId: c.id, targetKind: 'comment' });
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
                          ReportModal({ targetId: r.id, targetKind: 'comment' });
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
        />
      </div>
    </>
  );
}

interface CommentDrawerProps extends CommentDrawerContentProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  autoFocus?: boolean;
}

export default function CommentDrawer({
  videoId,
  onClose,
  onCountChange,
  open,
  onOpenChange,
  autoFocus,
}: CommentDrawerProps) {
  const opened = useRef(false);

  useEffect(() => {
    if (open && !opened.current) {
      const handleClose = () => {
        onOpenChange?.(false);
        onClose?.();
      };
      Overlay.open('drawer', {
        content: (
          <CommentDrawerContent
            videoId={videoId}
            onClose={handleClose}
            onCountChange={onCountChange}
          />
        ),
        onClose: handleClose,
        autoFocus,
      });
      opened.current = true;
    } else if (!open && opened.current) {
      Overlay.close();
      opened.current = false;
    }
    return () => {
      if (opened.current) {
        Overlay.close();
        opened.current = false;
      }
    };
  }, [open, videoId, onCountChange, autoFocus, onOpenChange, onClose]);

  return null;
}
