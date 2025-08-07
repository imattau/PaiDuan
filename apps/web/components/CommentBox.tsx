import { useState } from 'react';
import { SimplePool, Event } from 'nostr-tools';

const relays = ['wss://relay.damus.io', 'wss://nos.lol'];

interface CommentBoxProps {
  videoId: string;
  onSend?: (event: Event) => void;
}

export default function CommentBox({ videoId, onSend }: CommentBoxProps) {
  const [input, setInput] = useState('');

  const send = async () => {
    if (!input.trim()) return;
    const nostr =
      (typeof window !== 'undefined' && (window as any).nostr) || null;
    if (!nostr) return;
    try {
      const event: any = {
        kind: 1,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['e', videoId]],
        content: input,
      };
      const signed = await nostr.signEvent(event);
      await new SimplePool().publish(relays, signed);
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
