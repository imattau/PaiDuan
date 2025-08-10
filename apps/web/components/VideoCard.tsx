'use client';
import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, Repeat2, Volume2, VolumeX, MoreVertical } from 'lucide-react';
import ZapButton from './ZapButton';
import { useGesture, useSpring, animated } from '@paiduan/ui';
import CommentDrawer from './CommentDrawer';
import ReportModal from './ReportModal';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Skeleton } from './ui/Skeleton';
import useFollowing from '../hooks/useFollowing';
import toast from 'react-hot-toast';
import { useNetworkState } from 'react-use';
import useAdaptiveSource from '../hooks/useAdaptiveSource';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useCurrentVideo } from '../hooks/useCurrentVideo';
import { useFeedSelection } from '@/store/feedSelection';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { prefetchProfile } from '@/hooks/useProfiles';
import { nostr } from '@/agents/nostr';

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
  const playerRef = useRef<HTMLVideoElement>(null);
  const getPlayer = () => playerRef.current;
  const containerRef = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(true);
  const [speedMode, setSpeedMode] = useState(false);
  const [seekPreview, setSeekPreview] = useState(0);
  const adaptiveUrl = useAdaptiveSource(manifestUrl, playerRef);
  const [commentCount, setCommentCount] = useState(0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [reposted, setReposted] = useState(false);
  const holdTimer = useRef<number>();
  const [{ opacity }, api] = useSpring(() => ({ opacity: 0 }));
  const { state: auth } = useAuth();
  const { following, follow } = useFollowing(auth.status === 'ready' ? auth.pubkey : undefined);
  const profile = useProfile(pubkey);
  const avatar = profile?.picture || '';
  const displayName = profile?.name || author;
  const isFollowing = following.includes(pubkey);
  const { online } = useNetworkState();
  const [menuOpen, setMenuOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPlayIndicator, setShowPlayIndicator] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const { setCurrent } = useCurrentVideo();
  const { ref, inView } = useInView({ threshold: 0.7 });
  const setSelectedVideo = useFeedSelection((s) => s.setSelectedVideo);

  useEffect(() => {
    if (!errorMessage) return;
    const err = getPlayer()?.error;
    if (err) console.error('Video playback error:', err);
  }, [errorMessage]);

  useEffect(() => {
    const video = getPlayer();
    if (video) video.playbackRate = speedMode ? 2 : 1;
  }, [speedMode]);

  const [source, setSource] = useState<{ src: string; type: string }>();

  useEffect(() => {
    let cancelled = false;
    const checkSources = async () => {
      const videoEl = document.createElement('video');
      setErrorMessage(null);
      // Try adaptive/HLS source first
      if (adaptiveUrl) {
        try {
          const res = await fetch(adaptiveUrl, { method: 'HEAD' });
          const type = res.headers.get('content-type')?.toLowerCase() || '';
          const canPlayHls = videoEl.canPlayType('application/x-mpegURL');
          console.debug('checkSources HLS', { type, canPlayHls });
          if (type.includes('application/x-mpegurl') || type.includes('application/vnd.apple.mpegurl')) {
            if (canPlayHls && !cancelled) {
              setSource({ src: adaptiveUrl, type: 'application/x-mpegURL' });
              return;
            }
          }
        } catch {
          /* ignore and fallback */
        }
      }
      // Fallback to MP4
      try {
        const res = await fetch(videoUrl, { method: 'HEAD' });
        const type = res.headers.get('content-type')?.toLowerCase() || '';
        const canPlayMp4 = videoEl.canPlayType('video/mp4');
        console.debug('checkSources MP4', { type, canPlayMp4 });
        if (type.includes('video/mp4') && canPlayMp4) {
          if (!cancelled) {
            setSource({ src: videoUrl, type: 'video/mp4' });
            return;
          }
        } else if (!cancelled) {
          setErrorMessage('Unsupported video format');
        }
      } catch {
        if (!cancelled) setErrorMessage('Video unavailable');
      }
    };
    checkSources();
    return () => {
      cancelled = true;
    };
  }, [adaptiveUrl, videoUrl]);

  useEffect(() => {
    if (inView) {
      setCurrent({ eventId, pubkey, caption, posterUrl });
      setSelectedVideo(eventId, pubkey);
    }
  }, [inView, setCurrent, setSelectedVideo, eventId, pubkey, caption, posterUrl]);

  const handleRepost = async () => {
    if (auth.status !== 'ready') return;
    if (!window.confirm('Repost this video?')) return;
    try {
      await nostr.repost({
        eventId,
        originalPubkey: pubkey,
        myPubkey: auth.pubkey,
        signer: auth.signer,
      });
      setReposted(true);
      toast.success('Reposted');
    } catch (e) {
      console.error(e);
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
          const player = playerRef.current;
          if (player) {
            const newTime = Math.max(0, player.getCurrentTime() + delta);
            player.seekTo(newTime);
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
        setSpeedMode(true);
      } else {
        getPlayer()?.pause();
        setIsPlaying(false);
      }
    }, 250);
  };

  const handlePointerUp = () => {
    clearTimeout(holdTimer.current);
    if (speedMode) {
      setSpeedMode(false);
      api.start({ opacity: 0 });
      setSeekPreview(0);
    }
    setShowPlayIndicator(false);
    setIsPlaying(true);
    getPlayer()
      ?.play()
      .catch(() => {
        setShowPlayIndicator(true);
        setIsPlaying(false);
      });
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
      {source && !errorMessage && (
        <video
          ref={playerRef}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          loop
          muted={muted}
          playsInline
          poster={posterUrl}
          autoPlay={isPlaying}
          onLoadedData={() => {
            const video = getPlayer();
            if (video) {
              video.muted = true;
              video
                .play()
                .catch(() => {
                  setShowPlayIndicator(true);
                  setIsPlaying(false);
                });
            }
          }}
          onError={() => setErrorMessage('Video playback error')}
        >
          <source src={source.src} type={source.type} />
        </video>
      )}

      {showPlayIndicator && !errorMessage && (
        <button
          className="absolute inset-0 flex items-center justify-center bg-black/50 text-white"
          onClick={() => {
            setShowPlayIndicator(false);
            setIsPlaying(true);
            getPlayer()
              ?.play()
              .catch(() => {
                setShowPlayIndicator(true);
                setIsPlaying(false);
              });
          }}
          aria-label="Play video"
        >
          Tap to play
        </button>
      )}

      {errorMessage && (
        <>
          <img
            src={posterUrl || '/offline.jpg'}
            alt="Video unavailable"
            className="absolute inset-0 h-full w-full object-cover"
            onError={(e) => (e.currentTarget.src = '/offline.jpg')}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-4 text-center">
            {errorMessage}
          </div>
        </>
      )}

      {showMenu && (
        <div className="absolute right-4 top-4">
          <button onClick={() => setMenuOpen((o) => !o)} className="hover:text-accent-primary">
            <MoreVertical className="icon" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-24 rounded bg-background-primary p-1 shadow">
              <button
                className="block w-full rounded px-2 py-1 text-left text-sm hover:bg-text-primary/10"
                onClick={() => {
                  setMenuOpen(false);
                  ReportModal({ targetId: eventId, targetKind: 'video' });
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
          onClick={() => {
            const next = !muted;
            setMuted(next);
            const player = getPlayer();
            if (player) player.muted = next;
          }}
          title={muted ? 'Unmute' : 'Mute'}
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? <VolumeX className="icon" /> : <Volume2 className="icon" />}
        </button>
        <button
          className="relative hover:text-accent-primary disabled:opacity-50 lg:hidden"
          onClick={() => online && setCommentsOpen(true)}
          disabled={!online}
          title={!online ? 'Offline – reconnect to interact.' : undefined}
        >
          <MessageCircle className="icon" />
          {commentCount > 0 && (
            <span className="absolute -right-2 -top-2 text-xs text-primary">{commentCount}</span>
          )}
        </button>
        <CommentDrawer
          videoId={eventId}
          onCountChange={setCommentCount}
          open={commentsOpen}
          onOpenChange={setCommentsOpen}
          autoFocus={false}
        />
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
          disabled={!online || reposted}
          title={
            !online ? 'Offline – reconnect to interact.' : reposted ? 'Already reposted' : undefined
          }
        >
          <Repeat2 className="icon" />
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
              onError={(e) => (e.currentTarget.src = '/offline.jpg')}
            />
          ) : (
            <Skeleton className="h-10 w-10 rounded-full" />
          )}
          <div className="username">@{displayName}</div>
        </Link>
        {!isFollowing && (
          <button
            onClick={() => follow(pubkey)}
            className="mt-2 rounded bg-accent-primary px-2 py-1 text-sm text-white"
          >
            Follow
          </button>
        )}
        <div className="meta-info mt-1">{caption}</div>
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
    </motion.div>
  );
};

export default VideoCard;
