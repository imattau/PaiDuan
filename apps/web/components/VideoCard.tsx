import React, { useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import dynamic from 'next/dynamic';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import ZapButton from './ZapButton';
import { useGesture, useSpring, animated } from '@paiduan/ui';
import CommentDrawer from './CommentDrawer';
import ReportModal from './ReportModal';
import Link from 'next/link';
import Image from 'next/image';
import { SimplePool } from 'nostr-tools';
import useFollowing from '../hooks/useFollowing';
import toast from 'react-hot-toast';
import useOffline from '../utils/useOffline';
import useAdaptiveSource from '../hooks/useAdaptiveSource';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useCurrentVideo } from '../hooks/useCurrentVideo';
import { useFeedSelection } from '@/store/feedSelection';

const MoreVertical = dynamic(
  () => import('lucide-react').then((mod) => mod.MoreVertical),
  { ssr: false },
);

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
  onLike: () => void;
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
  onLike,
}) => {
  const playerRef = useRef<ReactPlayer>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(true);
  const [speedMode, setSpeedMode] = useState(false);
  const [seekPreview, setSeekPreview] = useState(0);
  const adaptiveUrl = useAdaptiveSource(manifestUrl, playerRef);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const holdTimer = useRef<number>();
  const [{ opacity }, api] = useSpring(() => ({ opacity: 0 }));
  const { following, follow } = useFollowing();
  const [avatar, setAvatar] = useState('');
  const [displayName, setDisplayName] = useState(author);
  const isFollowing = following.includes(pubkey);
  const online = useOffline();
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const { setCurrent } = useCurrentVideo();
  const { ref, inView } = useInView({ threshold: 0.7 });
  const setSelectedVideo = useFeedSelection((s) => s.setSelectedVideo);

  const handleShare = () => {
    const url = `${window.location.origin}/v/${eventId}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied');
  };

  useEffect(() => {
    const pool: any = new SimplePool();
    const relays = ['wss://relay.damus.io', 'wss://nos.lol'];
    const sub = pool.subscribeMany(relays, [{ kinds: [0], authors: [pubkey], limit: 1 }], {
      onevent: (ev: any) => {
        try {
          const content = JSON.parse(ev.content);
          if (content.picture) setAvatar(content.picture);
          if (content.name) setDisplayName(content.name);
        } catch {
          /* ignore */
        }
      },
    });
    return () => {
      sub.close();
    };
  }, [pubkey]);

  useEffect(() => {
    if (inView) {
      setCurrent({ eventId, pubkey, caption, posterUrl });
      setSelectedVideo(eventId, pubkey);
    }
  }, [inView, setCurrent, setSelectedVideo, eventId, pubkey, caption, posterUrl]);


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
      className="relative h-screen w-screen overflow-hidden rounded-2xl bg-brand-surface text-white shadow-card"
      onDoubleClick={onLike}
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
        muted
        playsinline
        width="100%"
        height="100%"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        config={{ file: { attributes: { poster: posterUrl } } }}
      />

      <div className="absolute right-4 top-4">
        <button onClick={() => setMenuOpen((o) => !o)} className="hover:text-accent">
          <MoreVertical />
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-24 rounded bg-background p-1 shadow">
            <button
              className="block w-full rounded px-2 py-1 text-left text-sm hover:bg-foreground/10"
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

      <div className="absolute right-4 bottom-24 flex flex-col items-center space-y-4">
        <button onClick={onLike} className="hover:text-accent">
          <Heart />
        </button>
        <button
          className="relative hover:text-accent disabled:opacity-50"
          onClick={() => online && setCommentsOpen(true)}
          disabled={!online}
          title={!online ? 'Offline – reconnect to interact.' : undefined}
        >
          <MessageCircle />
          {commentCount > 0 && (
            <span className="absolute -right-2 -top-2 text-xs text-foreground">{commentCount}</span>
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
        <button onClick={handleShare} className="hover:text-accent disabled:opacity-50" disabled={!online} title={!online ? 'Offline – reconnect to interact.' : undefined}>
          <Share2 />
        </button>
      </div>

      <div className="absolute bottom-0 left-0 w-full p-4">
        <Link href={`/p/${pubkey}`} className="flex items-center space-x-3">
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
            <div className="h-10 w-10 rounded-full bg-foreground/20" />
          )}
          <div className="font-semibold">@{displayName}</div>
        </Link>
        {!isFollowing && (
          <button
            onClick={() => follow(pubkey)}
            className="mt-2 rounded bg-accent px-2 py-1 text-sm text-white"
          >
            Follow
          </button>
        )}
        <div className="text-sm mt-1">{caption}</div>
      </div>

      <animated.div
        style={{ opacity }}
        className="absolute bottom-1/4 left-0 right-0 h-1 bg-foreground/50"
      >
        <div className="absolute left-1/2 top-0 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground" />
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 rounded bg-background/50 px-1 text-xs">
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
