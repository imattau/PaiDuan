import { useState } from 'react';
import { SimplePool } from 'nostr-tools/pool';
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
      await new SimplePool().publish(getRelays(), signed);
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
      placeholder="Add a comment"
      className="w-full rounded bg-foreground/10 p-2 text-sm outline-none"
    />
  );
}
