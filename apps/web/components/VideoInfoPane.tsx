import { useEffect, useState } from 'react';
import { SimplePool, Event } from 'nostr-tools';
import { useCurrentVideo } from '../hooks/useCurrentVideo';
import ZapButton from './ZapButton';
import useFollowing from '../hooks/useFollowing';
import CommentBox from './CommentBox';

const relays = ['wss://relay.damus.io', 'wss://nos.lol'];

export default function VideoInfoPane() {
  const { current } = useCurrentVideo();
  const { following, follow, unfollow } = useFollowing();

  const [authorMeta, setAuthorMeta] = useState<any>(null);
  const [comments, setComments] = useState<Event[]>([]);

  useEffect(() => {
    if (!current) return;
    (async () => {
      const pool = new SimplePool();
      try {
        const [meta] = await pool.list(relays, [
          { kinds: [0], authors: [current.pubkey], limit: 1 },
        ]);
        setAuthorMeta(meta ? JSON.parse(meta.content) : null);

        const comm = await pool.list(relays, [
          { kinds: [1], '#e': [current.eventId], limit: 20 },
        ]);
        setComments(comm.sort((a, b) => a.created_at - b.created_at));
      } catch {
        setAuthorMeta(null);
        setComments([]);
      }
    })();
  }, [current]);

  if (!current)
    return (
      <aside className="hidden lg:block lg:w-64 lg:fixed lg:inset-y-0 lg:right-0 lg:pr-4 lg:pt-6 text-white/70">
        <h2 className="mb-4 font-semibold">Trending 24 h</h2>
      </aside>
    );

  const isFollow = following.includes(current.pubkey);

  return (
    <aside className="hidden lg:block lg:w-64 lg:fixed lg:inset-y-0 lg:right-0 lg:pr-4 lg:pt-6 overflow-y-auto text-white">
      {authorMeta && (
        <div className="mb-6 flex items-center space-x-3">
          <img
            src={authorMeta.picture || '/avatar.svg'}
            alt="avatar"
            className="h-12 w-12 rounded-full object-cover"
          />
          <div>
            <div className="font-semibold">{authorMeta.name || current.pubkey.slice(0, 8)}</div>
            <button
              onClick={() => (isFollow ? unfollow(current.pubkey) : follow(current.pubkey))}
              className="mt-1 rounded-full border border-white/30 px-2 py-0.5 text-xs"
            >
              {isFollow ? 'Unfollow' : 'Follow'}
            </button>
          </div>
        </div>
      )}

      <ZapButton
        lightningAddress={authorMeta?.lud16 || ''}
        pubkey={current.pubkey}
        eventId={current.eventId}
        title="Send sats"
      />

      <hr className="my-4 border-white/10" />

      <h3 className="mb-2 text-lg font-semibold">Comments</h3>

      {comments.map((c) => (
        <div key={c.id} className="mb-3 text-sm opacity-80">
          <b>{c.pubkey.slice(0, 8)}</b> {c.content}
        </div>
      ))}

      <CommentBox videoId={current.eventId} onSend={() => null} />
    </aside>
  );
}
