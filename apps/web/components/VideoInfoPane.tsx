import { useEffect, useState } from 'react';
import { SimplePool, Event } from 'nostr-tools';
import { useCurrentVideo } from '../hooks/useCurrentVideo';
import { useFollowing } from '../hooks/useFollowing';
import ZapButton from './ZapButton';

const relays = ['wss://relay.damus.io', 'wss://nos.lol'];

export default function VideoInfoPane() {
  const { current } = useCurrentVideo();
  const { following, follow, unfollow } = useFollowing();
  const [meta, setMeta] = useState<any>(null);
  const [comments, setComments] = useState<Event[]>([]);

  useEffect(() => {
    if (!current) return;
    (async () => {
      const pool = new SimplePool();
      try {
        const [m] = await pool.list(relays, [{ kinds: [0], authors: [current.pubkey], limit: 1 }]);
        setMeta(m ? JSON.parse(m.content) : null);
        const c = await pool.list(relays, [{ kinds: [1], '#e': [current.eventId], limit: 20 }]);
        setComments(c.sort((a, b) => a.created_at - b.created_at));
      } catch {
        /* ignore */
      }
    })();
  }, [current]);

  if (!current)
    return (
      <aside className="hidden lg:block lg:w-64 lg:fixed lg:right-0 lg:inset-y-0 lg:pr-4 lg:pt-6 text-white/70">
        <p className="px-2">Trending soon…</p>
      </aside>
    );

  const isFollow = following.includes(current.pubkey);

  return (
    <aside className="hidden lg:block lg:w-64 lg:fixed lg:right-0 lg:inset-y-0 lg:pr-4 lg:pt-6 overflow-y-auto space-y-6 text-white">
      <div className="flex items-center space-x-3">
        <img src={meta?.picture || '/avatar.svg'} className="h-12 w-12 rounded-full" />
        <div>
          <div className="font-semibold">{meta?.name || current.pubkey.slice(0, 8)}</div>
          <button
            onClick={() => (isFollow ? unfollow(current.pubkey) : follow(current.pubkey))}
            className="mt-1 rounded-full border border-white/30 px-2 py-0.5 text-xs"
          >
            {isFollow ? 'Unfollow' : 'Follow'}
          </button>
        </div>
      </div>

      <ZapButton pubkey={current.pubkey} eventId={current.eventId} lightningAddress={meta?.lud16 || ''} />

      <div>
        <h3 className="mb-2 text-lg font-semibold">Comments</h3>
        {comments.map((c) => (
          <div key={c.id} className="mb-3 text-sm opacity-80">
            <b>{c.pubkey.slice(0, 8)}</b> {c.content}
          </div>
        ))}
      </div>
    </aside>
  );
}
