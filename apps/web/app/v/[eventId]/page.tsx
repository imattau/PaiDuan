'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import pool from '@/lib/relayPool';
import type { Event as NostrEvent } from 'nostr-tools/pure';
import VideoCard, { VideoCardProps } from '@/components/VideoCard';
import ZapButton from '@/components/ZapButton';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { getRelays } from '@/lib/nostr';
import CommentDrawer from '@/components/CommentDrawer';

export default function VideoPage() {
  const { eventId } = useParams<{ eventId?: string }>();
  const [video, setVideo] = useState<VideoCardProps | null>(null);
  const [commentVideoId, setCommentVideoId] = useState<string | null>(null);
  const { state } = useAuth();
  const profile = useProfile(state.status === 'ready' ? state.pubkey : undefined);
  const hasWallet = !!profile?.wallets?.length;

  useEffect(() => {
    if (!eventId) return;
    document.body.style.overflow = 'hidden';
    const relays = getRelays();
    pool.get(relays, { ids: [eventId] }).then((ev) => {
      const event = ev as NostrEvent | null;
      if (!event) return;
      const videoTag = event.tags.find((t) => t[0] === 'v');
      if (!videoTag) return;
      const posterTag = event.tags.find((t) => t[0] === 'image');
      const manifestTag = event.tags.find((t) => t[0] === 'vman');
      const zapTags = event.tags.filter((t) => t[0] === 'zap');
      const tTags = event.tags.filter((t) => t[0] === 't').map((t) => t[1]);
      setVideo({
        videoUrl: videoTag[1],
        posterUrl: posterTag ? posterTag[1] : undefined,
        manifestUrl: manifestTag ? manifestTag[1] : undefined,
        author: event.pubkey.slice(0, 8),
        caption: tTags.join(' '),
        eventId: event.id,
        lightningAddress: zapTags.length ? zapTags[0][1] : '',
        pubkey: event.pubkey,
        zapTotal: 0,
      });
    });
    return () => {
      document.body.style.overflow = '';
    };
  }, [eventId]);

  if (!video)
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        Loading...
      </div>
    );
  return (
    <>
      <div className="flex h-screen items-start justify-center lg:items-center [height:calc(100dvh-var(--top-nav-height,0)-var(--bottom-nav-height,0))]">
        <VideoCard
          {...video}
          showMenu
          onComment={() => setCommentVideoId(video.eventId)}
          zap={
            <ZapButton
              lightningAddress={video.lightningAddress ?? ''}
              pubkey={video.pubkey}
              eventId={video.eventId}
              total={video.zapTotal}
              disabled={!hasWallet}
              title={!hasWallet ? 'Add a wallet to zap' : undefined}
            />
          }
        />
      </div>
      <CommentDrawer
        videoId={commentVideoId || ''}
        open={!!commentVideoId}
        onOpenChange={(o) => !o && setCommentVideoId(null)}
      />
    </>
  );
}
