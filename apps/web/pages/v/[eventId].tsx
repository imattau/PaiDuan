import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { SimplePool, Event as NostrEvent } from 'nostr-tools';
import VideoCard, { VideoCardProps } from '../../components/VideoCard';

function relayList(): string[] {
  if (typeof window === 'undefined') return ['wss://relay.damus.io', 'wss://nos.lol'];
  const nostr = (window as any).nostr;
  if (nostr?.getRelays) {
    try {
      const relays = nostr.getRelays();
      if (Array.isArray(relays)) return relays;
      if (relays && typeof relays === 'object') return Object.keys(relays);
    } catch {
      /* ignore */
    }
  }
  return ['wss://relay.damus.io', 'wss://nos.lol'];
}

export default function VideoPage() {
  const router = useRouter();
  const { eventId } = router.query as { eventId?: string };
  const [video, setVideo] = useState<VideoCardProps | null>(null);

  useEffect(() => {
    if (!eventId) return;
    document.body.style.overflow = 'hidden';
    const pool = new SimplePool();
    const relays = relayList();
    pool.get(relays, { ids: [eventId] }).then((ev: NostrEvent | null) => {
      if (!ev) return;
      const videoTag = ev.tags.find((t) => t[0] === 'v');
      if (!videoTag) return;
      const posterTag = ev.tags.find((t) => t[0] === 'image');
      const zapTag = ev.tags.find((t) => t[0] === 'zap');
      const tTags = ev.tags.filter((t) => t[0] === 't').map((t) => t[1]);
      setVideo({
        videoUrl: videoTag[1],
        posterUrl: posterTag ? posterTag[1] : undefined,
        author: ev.pubkey.slice(0, 8),
        caption: tTags.join(' '),
        eventId: ev.id,
        lightningAddress: zapTag ? zapTag[1] : '',
        pubkey: ev.pubkey,
        zapTotal: 0,
        onLike: () => {},
      });
    });
    return () => {
      document.body.style.overflow = '';
    };
  }, [eventId]);

  if (!video) return <div className="flex min-h-screen items-center justify-center bg-black text-white">Loading...</div>;
  return <VideoCard {...video} />;
}
