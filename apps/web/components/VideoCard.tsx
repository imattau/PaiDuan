'use client';
import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, Repeat2, Volume2, VolumeX, MoreVertical } from 'lucide-react';
import { useGesture, useSpring, animated } from '@paiduan/ui';
import ReportModal from './ReportModal';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Skeleton } from './ui/Skeleton';
import { useNetworkState } from 'react-use';
import { playback } from '@/agents/playback';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useCurrentVideo } from '../hooks/useCurrentVideo';
import { useFeedSelection } from '@/store/feedSelection';
import { usePlaybackPrefs } from '@/store/playbackPrefs';
import { useFollowingStore } from '@/store/following';
import { useProfile } from '@/hooks/useProfile';
import { prefetchProfile } from '@/hooks/useProfiles';
import PlaceholderVideo from './PlaceholderVideo';
import VideoFallback from './VideoFallback';
import { telemetry } from '@/agents/telemetry';

export interface VideoCardProps {
  videoUrl: string;
  posterUrl?: string;
  manifestUrl?: string;
  author: string;
  caption: string;
  eventId: string;
  lightningAddress?: string;
  pubkey: string;
  zapTotal?: number;
  showMenu?: boolean;
  commentCount?: number;
  onComment?: () => void;
  onRepost?: () => Promise<void> | void;
  zap?: React.ReactNode;
  /**
   * Fired when the underlying video element has loaded enough data to play.
   * Useful for triggering measurements or other side effects once the video is ready.
   */
  onReady?: () => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  videoUrl,
  posterUrl,
  manifestUrl,
  author,
  caption,
  eventId,
  lightningAddress: _lightningAddress,
  pubkey,
  zapTotal: _zapTotal,
  showMenu = false,
  commentCount = 0,
  onComment,
  onRepost,
  zap,
  onReady,
}) => {
  const router = useRouter();
  const playerRef = useRef<HTMLVideoElement>(null);
  const getPlayer = () => playerRef.current;
  const containerRef = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = usePlaybackPrefs((s) => [s.isMuted, s.setMuted]);
  const [speedMode, setSpeedMode] = useState(false);
  const [seekPreview, setSeekPreview] = useState(0);
  const [reposted, setReposted] = useState(false);
  const holdTimer = useRef<number>();
  const [{ opacity }, api] = useSpring(() => ({ opacity: 0 }));
  const { following, follow } = useFollowingStore();
  const profile = useProfile(pubkey);
  const avatar = profile?.picture || '';
  const displayName = profile?.name || author;
  const isFollowing = following.includes(pubkey);
  const { online } = useNetworkState();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPlayIndicator, setShowPlayIndicator] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [triedFallback, setTriedFallback] = useState(false);
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

  useEffect(() => {
    const video = playerRef.current;
    if (!video) return;
    playback.loadSource(video, { videoUrl, manifestUrl, eventId });
    const offState = playback.onStateChange((state) => {
      setIsPlaying(state === 'playing');
    });
    const offError = playback.onError((message) => {
      setErrorMessage(message);
    });
    return () => {
      offState();
      offError();
    };
  }, [manifestUrl, videoUrl]);

  useEffect(() => {
    if (inView) {
      setCurrent({ eventId, pubkey, caption, posterUrl });
      setSelectedVideo(eventId, pubkey);
    }
  }, [inView, setCurrent, setSelectedVideo, eventId, pubkey, caption, posterUrl]);

  const handleRepost = async () => {
    if (!onRepost) return;
    if (!window.confirm('Repost this video?')) return;
    await onRepost();
    setReposted(true);
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
            const newTime = Math.max(0, player.currentTime + delta);
            player.currentTime = newTime;
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
        playback.pause();
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
    playback.play().catch(() => {
      setShowPlayIndicator(true);
      setIsPlaying(false);
    });
  };

  const handleVideoError = async () => {
    setShowPlayIndicator(false);
    setIsPlaying(false);
    const primaryUrl = manifestUrl ?? videoUrl;
    try {
      const res = await fetch(primaryUrl, { method: 'HEAD' });
      if (res.status === 404 && manifestUrl && !triedFallback) {
        setTriedFallback(true);
        setLoaded(false);
        setErrorMessage(null);
        const player = getPlayer();
        if (player) {
          playback.loadSource(player, { videoUrl, eventId });
          playback.play().catch(() => {
            setErrorMessage('Video unavailable');
            telemetry.track('video.unavailable', { eventId, url: videoUrl, status: 'play_failed' });
          });
        }
        return;
      }
      setErrorMessage('Video unavailable');
      telemetry.track('video.unavailable', {
        eventId,
        url: primaryUrl,
        status: res.status,
      });
    } catch {
      setErrorMessage('Video unavailable');
      telemetry.track('video.unavailable', { eventId, url: primaryUrl });
    }
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
      className="relative mx-auto w-full max-h-[calc(100dvh-var(--bottom-nav-height,0))] sm:max-h-[calc(100vh-var(--bottom-nav-height,0))] max-w-[calc((100dvh-var(--bottom-nav-height,0))*9/16)] sm:max-w-[calc((100vh-var(--bottom-nav-height,0))*9/16)] aspect-[9/16] overflow-hidden rounded-2xl bg-card text-white shadow-card"
      onClick={() => setSelectedVideo(eventId, pubkey)}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      {...bind()}
    >
      {!loaded && !errorMessage && (
        <PlaceholderVideo className="absolute inset-0 h-full w-full" message="Loading video…" />
      )}
      {!errorMessage && (
        <video
          ref={playerRef}
          className={`pointer-events-none absolute inset-0 h-full w-full object-cover ${loaded ? '' : 'hidden'}`}
          loop
          muted={muted}
          playsInline
          poster={posterUrl}
          autoPlay={isPlaying}
          src={!manifestUrl ? videoUrl : undefined}
          onLoadedData={() => {
            setLoaded(true);
            const video = getPlayer();
            if (video) {
              video.muted = muted;
              playback.play().catch(() => {
                setShowPlayIndicator(true);
                setIsPlaying(false);
              });
            }
            onReady?.();
          }}
          onError={handleVideoError}
        />
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

      {errorMessage && <VideoFallback posterUrl={posterUrl} message={errorMessage} />}

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

      <div className="absolute right-4 bottom-24 z-10 flex flex-col items-center space-y-4 lg:right-6 lg:bottom-32 lg:space-y-6">
        <button
          type="button"
          className="hover:text-accent-primary"
          onClick={() => {
            const next = !muted;
            setMuted(next);
            const player = getPlayer();
            if (player) player.muted = next;
          }}
          title={muted ? 'Unmute' : 'Mute'}
          aria-label={muted ? 'Unmute' : 'Mute'}
          aria-pressed={!muted}
        >
          {muted ? (
            <VolumeX className="icon action-bar-icon md:h-8 md:w-8" />
          ) : (
            <Volume2 className="icon action-bar-icon md:h-8 md:w-8" />
          )}
        </button>
        <button
          className="relative hover:text-accent-primary disabled:opacity-50 lg:hidden"
          onClick={() => online && onComment?.()}
          disabled={!online}
          title={!online ? 'Offline – reconnect to interact.' : undefined}
          aria-label="Comments"
        >
          <MessageCircle className="icon action-bar-icon md:h-8 md:w-8" />
          {commentCount > 0 && (
            <span className="absolute -right-2 -top-2 text-xs text-primary">{commentCount}</span>
          )}
        </button>
        {zap}
        <button
          onClick={handleRepost}
          className="hover:text-accent-primary disabled:opacity-50"
          disabled={!online || reposted}
          title={
            !online ? 'Offline – reconnect to interact.' : reposted ? 'Already reposted' : undefined
          }
        >
          <Repeat2 className="icon action-bar-icon md:h-8 md:w-8" />
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
              onError={(e) => (e.currentTarget.src = '/avatar.svg')}
              crossOrigin="anonymous"
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
