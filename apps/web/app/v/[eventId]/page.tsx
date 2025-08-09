"use client";
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import pool from '@/lib/relayPool';
import type { Event as NostrEvent } from 'nostr-tools/pure';
import VideoCard, { VideoCardProps } from '@/components/VideoCard';
import { getRelays } from '@/lib/nostr';

export default function VideoPage() {
  const { eventId } = useParams<{ eventId?: string }>();
  const [video, setVideo] = useState<VideoCardProps | null>(null);

  useEffect(() => {
    if (!eventId) return;
    document.body.style.overflow = 'hidden';
      const relays = getRelays();
      pool.get(relays, { ids: [eventId] }).then((ev: NostrEvent | null) => {
      if (!ev) return;
      const videoTag = ev.tags.find((t) => t[0] === 'v');
      if (!videoTag) return;
      const posterTag = ev.tags.find((t) => t[0] === 'image');
      const manifestTag = ev.tags.find((t) => t[0] === 'vman');
      const zapTags = ev.tags.filter((t) => t[0] === 'zap');
      const tTags = ev.tags.filter((t) => t[0] === 't').map((t) => t[1]);
      setVideo({
        videoUrl: videoTag[1],
        posterUrl: posterTag ? posterTag[1] : undefined,
        manifestUrl: manifestTag ? manifestTag[1] : undefined,
        author: ev.pubkey.slice(0, 8),
        caption: tTags.join(' '),
        eventId: ev.id,
        lightningAddress: zapTags.length ? zapTags[0][1] : '',
        pubkey: ev.pubkey,
        zapTotal: 0,
      });
    });
    return () => {
      document.body.style.overflow = '';
    };
  }, [eventId]);

  if (!video) return <div className="flex min-h-screen items-center justify-center bg-black text-white">Loading...</div>;
  return <VideoCard {...video} showMenu />;
}
