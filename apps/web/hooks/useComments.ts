import { useCallback, useEffect, useState } from 'react';
import type { Event as NostrEvent } from 'nostr-tools/pure';
import { useAuth } from './useAuth';
import { nostr } from '@/agents/nostr';

export function useComments(videoId: string) {
  const { state } = useAuth();
  const [comments, setComments] = useState<NostrEvent[]>([]);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setComments([]);
    setHiddenIds(new Set());
    const sub = nostr.comments.subscribe(
      videoId,
      (ev) => {
        setComments((prev) => {
          if (prev.find((p) => p.id === ev.id)) return prev;
          return [...prev, ev].sort((a, b) => a.created_at - b.created_at);
        });
      },
      (id) => setHiddenIds((prev) => new Set(prev).add(id)),
    );
    return () => sub.close();
  }, [videoId]);

  const send = useCallback(
    async (content: string, replyTo?: NostrEvent) => {
      if (state.status !== 'ready') throw new Error('signer required');
      const signed = await nostr.comments.sendComment(
        videoId,
        content,
        state.signer,
        replyTo,
      );
      setComments((prev) => [...prev, signed].sort((a, b) => a.created_at - b.created_at));
    },
    [videoId, state],
  );

  return { comments, hiddenIds, send, canSend: state.status === 'ready' };
}

export default useComments;
