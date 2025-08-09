import React, { useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import dynamic from 'next/dynamic';
import { MessageCircle, Repeat2, Volume2, VolumeX } from 'lucide-react';
import ZapButton from './ZapButton';
import { useGesture, useSpring, animated } from '@paiduan/ui';
import CommentDrawer from './CommentDrawer';
import ReportModal from './ReportModal';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { Skeleton } from './ui/Skeleton';
import useFollowing from '../hooks/useFollowing';
import toast from 'react-hot-toast';
import useOffline from '../utils/useOffline';
import useAdaptiveSource from '../hooks/useAdaptiveSource';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useCurrentVideo } from '../hooks/useCurrentVideo';
import { useFeedSelection } from '@/store/feedSelection';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { prefetchProfile } from '@/hooks/useProfiles';
import { SimplePool } from 'nostr-tools/pool';
import { getRelays } from '@/lib/nostr';

const MoreVertical = dynamic(() => import('lucide-react').then((mod) => mod.MoreVertical), {
  ssr: false,
});

export interface VideoCardProps {
  videoUrl: string;
  posterUrl?: string;
  manifestUrl?: string;
  author: string;
  caption: string;
  eventId: string;
  lightningAddress: string;
  pubkey: string;
  zapTotal?: number;
  showMenu?: boolean;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  videoUrl,
  posterUrl,
  manifestUrl,
  author,
  caption,
  eventId,
  lightningAddress,
  pubkey,
  zapTotal,
  showMenu = false,
}) => {
  const router = useRouter();
  const playerRef = useRef<ReactPlayer>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [speedMode, setSpeedMode] = useState(false);
  const [seekPreview, setSeekPreview] = useState(0);
  const adaptiveUrl = useAdaptiveSource(manifestUrl, playerRef);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const holdTimer = useRef<number>();
  const [{ opacity }, api] = useSpring(() => ({ opacity: 0 }));
  const { state: auth } = useAuth();
  const { following, follow } = useFollowing(auth.status === 'ready' ? auth.pubkey : undefined);
  const profile = useProfile(pubkey);
  const avatar = profile?.picture || '';
  const displayName = profile?.name || author;
  const isFollowing = following.includes(pubkey);
  const online = useOffline();
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const { setCurrent } = useCurrentVideo();
  const { ref, inView } = useInView({ threshold: 0.7 });
  const setSelectedVideo = useFeedSelection((s) => s.setSelectedVideo);

  useEffect(() => {
    if (inView) {
      setCurrent({ eventId, pubkey, caption, posterUrl });
      setSelectedVideo(eventId, pubkey);
    }
  }, [inView, setCurrent, setSelectedVideo, eventId, pubkey, caption, posterUrl]);

  const handleRepost = async () => {
    if (auth.status !== 'ready') return;
    try {
      const event: any = {
        kind: 6,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ['e', eventId],
          ['p', pubkey],
        ],
        content: '',
        pubkey: auth.pubkey,
      };
      const signed = await auth.signer.signEvent(event);
      await new SimplePool().publish(getRelays(), signed);
      toast.success('Reposted');
    } catch {
      toast.error('Repost failed');
    }
  };

  const bind = useGesture(
    {
      onDrag: ({ down, movement: [mx] }) => {
        if (!speedMode) return;
        const delta = (mx / 60) * 3;
        setSeekPreview(delta);
        if (!down) {
          const video = playerRef.current?.getInternalPlayer() as HTMLVideoElement;
          if (video) {
            video.currentTime = Math.max(0, video.currentTime + delta);
          }
          setSeekPreview(0);
          api.start({ opacity: 0 });
        } else {
          api.start({ opacity: 1 });
        }
      },
    },
    { drag: { axis: 'x', filterTaps: true } },
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const isBottom = rect ? e.clientY > rect.top + rect.height * 0.75 : false;
    holdTimer.current = window.setTimeout(() => {
      if (isBottom) {
        const video = playerRef.current?.getInternalPlayer() as HTMLVideoElement;
        if (video) {
          video.playbackRate = 2;
        }
        setSpeedMode(true);
      } else {
        setPlaying(false);
      }
    }, 250);
  };

  const handlePointerUp = () => {
    clearTimeout(holdTimer.current);
    if (speedMode) {
      const video = playerRef.current?.getInternalPlayer() as HTMLVideoElement;
      if (video) {
        video.playbackRate = 1;
      }
      setSpeedMode(false);
      api.start({ opacity: 0 });
      setSeekPreview(0);
    }
    setPlaying(true);
  };

  return (
    <motion.div
      ref={(el) => {
        containerRef.current = el;
        ref(el);
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="relative w-full h-full max-h-full overflow-hidden rounded-2xl bg-card text-white shadow-card"
      onClick={() => setSelectedVideo(eventId, pubkey)}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      {...bind()}
    >
      <ReactPlayer
        ref={playerRef}
        url={manifestUrl ? adaptiveUrl || videoUrl : videoUrl}
        playing={playing}
        loop
        muted={muted}
        playsinline
        width="100%"
        height="100%"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        config={{ file: { attributes: { poster: posterUrl } } }}
      />

      {showMenu && (
        <div className="absolute right-4 top-4">
          <button onClick={() => setMenuOpen((o) => !o)} className="hover:text-accent-primary">
            <MoreVertical />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-24 rounded bg-background-primary p-1 shadow">
              <button
                className="block w-full rounded px-2 py-1 text-left text-sm hover:bg-text-primary/10"
                onClick={() => {
                  setMenuOpen(false);
                  setReportOpen(true);
                }}
              >
                Report
              </button>
            </div>
          )}
        </div>
      )}

      <div className="absolute right-4 bottom-24 flex flex-col items-center space-y-4">
        <button
          className="hover:text-accent-primary"
          onClick={() => setMuted((m) => !m)}
          title={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? <VolumeX /> : <Volume2 />}
        </button>
        <button
          className="relative hover:text-accent-primary disabled:opacity-50 lg:hidden"
          onClick={() => online && setCommentsOpen(true)}
          disabled={!online}
          title={!online ? 'Offline – reconnect to interact.' : undefined}
        >
          <MessageCircle />
          {commentCount > 0 && (
            <span className="absolute -right-2 -top-2 text-xs text-primary">{commentCount}</span>
          )}
        </button>
        <ZapButton
          lightningAddress={lightningAddress}
          eventId={eventId}
          pubkey={pubkey}
          total={zapTotal}
          disabled={!online}
          title={!online ? 'Offline – reconnect to interact.' : undefined}
        />
        <button
          onClick={handleRepost}
          className="hover:text-accent-primary disabled:opacity-50"
          disabled={!online}
          title={!online ? 'Offline – reconnect to interact.' : undefined}
        >
          <Repeat2 />
        </button>
      </div>

      <div className="absolute bottom-0 left-0 w-full p-4">
        <Link
          href={`/p/${pubkey}`}
          className="flex items-center space-x-3"
          prefetch={false}
          onMouseEnter={() => {
            router.prefetch(`/p/${pubkey}`);
            prefetchProfile(pubkey);
          }}
        >
          {avatar ? (
            <Image
              src={avatar}
              alt={displayName}
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover"
              unoptimized
            />
          ) : (
            <Skeleton className="h-10 w-10 rounded-full" />
          )}
          <div className="font-semibold">@{displayName}</div>
        </Link>
        {!isFollowing && (
          <button
            onClick={() => follow(pubkey)}
            className="mt-2 rounded bg-accent-primary px-2 py-1 text-sm text-white"
          >
            Follow
          </button>
        )}
        <div className="text-sm mt-1">{caption}</div>
      </div>

      <animated.div
        style={{ opacity }}
        className="absolute bottom-1/4 left-0 right-0 h-1 bg-text-primary/50"
      >
        <div className="absolute left-1/2 top-0 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-text-primary" />
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 rounded bg-background-primary/50 px-1 text-xs">
          {seekPreview.toFixed(1)}s
        </div>
      </animated.div>
      <CommentDrawer
        videoId={eventId}
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        onCountChange={setCommentCount}
      />
      <ReportModal
        targetId={eventId}
        targetKind="video"
        open={reportOpen}
        onClose={() => setReportOpen(false)}
      />
    </motion.div>
  );
};

export default VideoCard;
