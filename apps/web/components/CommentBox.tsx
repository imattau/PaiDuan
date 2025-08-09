import { useState } from 'react';
import pool from '@/lib/relayPool';
import type { Event } from 'nostr-tools/pure';
import { useAuth } from '@/hooks/useAuth';
import { getRelays } from '@/lib/nostr';

interface CommentBoxProps {
  videoId: string;
  onSend?: (event: Event) => void;
}

export default function CommentBox({ videoId, onSend }: CommentBoxProps) {
  const [input, setInput] = useState('');
  const { state } = useAuth();

  const send = async () => {
    if (!input.trim()) return;
    if (state.status !== 'ready') return;
    try {
      const event: any = {
        kind: 1,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['e', videoId]],
        content: input,
        pubkey: state.pubkey,
      };
        const signed = await state.signer.signEvent(event);
        await pool.publish(getRelays(), signed);
      setInput('');
      onSend?.(signed);
    } catch {
      /* ignore */
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      send();
    }
  };

  return (
    <input
      value={input}
      onChange={(e) => setInput(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder="Share your thoughts…"
      className="w-full rounded-lg bg-text-primary/20 px-3 py-2 text-sm outline-none"
    />
  );
}
