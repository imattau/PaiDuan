import React, { useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import { Heart, MessageCircle } from 'lucide-react';
import ZapButton from './ZapButton';
import { useGesture, useSpring, animated } from '@paiduan/ui';
import CommentDrawer from './CommentDrawer';
import Link from 'next/link';
import { SimplePool } from 'nostr-tools';
import useFollowing from '../hooks/useFollowing';

export interface VideoCardProps {
  videoUrl: string;
  posterUrl?: string;
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
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const holdTimer = useRef<number>();
  const [{ opacity }, api] = useSpring(() => ({ opacity: 0 }));
  const { following, follow } = useFollowing();
  const [avatar, setAvatar] = useState('');
  const [displayName, setDisplayName] = useState(author);
  const isFollowing = following.includes(pubkey);

  useEffect(() => {
    const pool = new SimplePool();
    const relays = ['wss://relay.damus.io', 'wss://nos.lol'];
    const sub = pool.sub(relays, [{ kinds: [0], authors: [pubkey], limit: 1 }]);
    sub.on('event', (ev) => {
      try {
        const content = JSON.parse(ev.content);
        if (content.picture) setAvatar(content.picture);
        if (content.name) setDisplayName(content.name);
      } catch {
        /* ignore */
      }
    });
    return () => {
      sub.unsub();
    };
  }, [pubkey]);

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
    <div
      ref={containerRef}
      className="relative h-screen w-screen overflow-hidden bg-black text-white"
      onDoubleClick={onLike}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      {...bind()}
    >
      <ReactPlayer
        ref={playerRef}
        url={videoUrl}
        playing={playing}
        loop
        muted
        playsinline
        width="100%"
        height="100%"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        config={{ file: { attributes: { poster: posterUrl } } }}
      />

      <div className="absolute right-4 bottom-24 flex flex-col items-center space-y-4">
        <button onClick={onLike} className="text-white">
          <Heart />
        </button>
        <button className="relative text-white" onClick={() => setCommentsOpen(true)}>
          <MessageCircle />
          {commentCount > 0 && (
            <span className="absolute -right-2 -top-2 text-xs">{commentCount}</span>
          )}
        </button>
        <ZapButton
          lightningAddress={lightningAddress}
          eventId={eventId}
          pubkey={pubkey}
          total={zapTotal}
        />
      </div>

      <div className="absolute bottom-0 left-0 w-full p-4">
        <Link href={`/p/${pubkey}`} className="flex items-center space-x-3">
          {avatar ? (
            <img src={avatar} alt={displayName} className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gray-500" />
          )}
          <div className="font-semibold">@{displayName}</div>
        </Link>
        {!isFollowing && (
          <button onClick={() => follow(pubkey)} className="mt-2 text-sm text-white">
            Follow
          </button>
        )}
        <div className="text-sm mt-1">{caption}</div>
      </div>

      <animated.div
        style={{ opacity }}
        className="absolute bottom-1/4 left-0 right-0 h-1 bg-white/50"
      >
        <div className="absolute left-1/2 top-0 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 rounded bg-black/50 px-1 text-xs">
          {seekPreview.toFixed(1)}s
        </div>
      </animated.div>
      <CommentDrawer
        videoId={eventId}
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        onCountChange={setCommentCount}
      />
    </div>
  );
};

export default VideoCard;
