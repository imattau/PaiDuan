'use client';
import { useState } from 'react';
import { useThread } from '@/hooks/useThread';
import { useProfile } from '@/hooks/useProfile';
import { SkeletonComment } from '../ui/SkeletonComment';

export default function Thread({
  rootId,
  authorPubkey,
}: {
  rootId?: string;
  authorPubkey?: string;
}) {
  const { notes, loading, err, send } = useThread(rootId);
  const [text, setText] = useState('');
  const author = useProfile(authorPubkey);

  async function onSend() {
    if (!text.trim()) return;
    try {
      await send(text.trim());
      setText('');
    } catch (e: any) {
      alert(e.message || 'Failed to send comment');
    }
  }

  return (
    <div className="p-4">
      <h3 className="font-semibold mb-1">Comments</h3>
      <p className="text-xs text-muted-foreground mb-4">
        {author?.name ? `Discuss with ${author.name}` : 'Join the discussion'}
      </p>

      <div className="space-y-3">
        {notes.map((n) => (
          <div key={n.id} className="text-sm">
            <div className="font-medium">{n.pubkey.slice(0, 8)}…</div>
            <div className="text-sm">{n.content}</div>
          </div>
        ))}
        {loading && (
          <>
            <SkeletonComment />
            <SkeletonComment />
          </>
        )}
        {err && <div className="text-sm text-red-600">{err}</div>}
      </div>
      <hr className="border-token my-4" />

      <div className="mt-4 flex gap-2">
        <input
          className="flex-1 rounded-lg bg-foreground/20 px-3 py-2 text-sm"
          placeholder="Share your thoughts…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="btn btn-primary" onClick={onSend}>
          Send
        </button>
      </div>
    </div>
  );
}
