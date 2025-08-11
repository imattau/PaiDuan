'use client';
import React, { useEffect, useRef, useState } from 'react';
import ReactPlayer, { ReactPlayerProps } from 'react-player';
import { useInView } from 'react-intersection-observer';
import PlaceholderVideo from './PlaceholderVideo';
import VideoFallback from './VideoFallback';
import { usePlaybackPrefs } from '@/store/playbackPrefs';
import { useFeedSelection } from '@/store/feedSelection';

export interface VideoCardReactPlayerProps {
  videoUrl: string;
  manifestUrl?: string;
  posterUrl?: string;
  eventId: string;
  onReady?: () => void;
}

const STORAGE_KEY = 'lastPlaybackPosition';
const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24h

type ProgressEntry = { currentTime: number; timestamp: number };
type ProgressMap = Record<string, ProgressEntry>;

function loadStore(): ProgressMap {
  if (typeof sessionStorage === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    return {};
  }
}

function saveStore(store: ProgressMap) {
  if (typeof sessionStorage === 'undefined') return;
  try {
    if (Object.keys(store).length === 0) {
      sessionStorage.removeItem(STORAGE_KEY);
    } else {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    }
  } catch {
    // ignore
  }
}

function loadProgress(eventId: string): number | null {
  const store = loadStore();
  const now = Date.now();
  let changed = false;
  for (const [id, entry] of Object.entries(store)) {
    if (now - entry.timestamp > EXPIRY_MS) {
      delete store[id];
      changed = true;
    }
  }
  if (changed) saveStore(store);
  const entry = store[eventId];
  return entry ? entry.currentTime : null;
}

function saveProgress(eventId: string, currentTime: number) {
  const store = loadStore();
  store[eventId] = { currentTime, timestamp: Date.now() };
  saveStore(store);
}

function clearProgress(eventId: string) {
  const store = loadStore();
  if (eventId in store) {
    delete store[eventId];
    saveStore(store);
  }
}

export const VideoCardReactPlayer: React.FC<VideoCardReactPlayerProps> = ({
  videoUrl,
  manifestUrl,
  posterUrl,
  eventId,
  onReady,
}) => {
  const playerRef = useRef<ReactPlayer>(null);
  const { ref, inView } = useInView({ threshold: 0.25 });
  const [muted, setMuted] = usePlaybackPrefs((s) => [s.isMuted, s.setMuted]);
  const selectedVideoId = useFeedSelection((s) => s.selectedVideoId);
  const setSelectedVideo = useFeedSelection((s) => s.setSelectedVideo);
  const isActive = inView || selectedVideoId === eventId;
  const [playing, setPlaying] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPlaying(isActive);
  }, [isActive]);

  useEffect(() => {
    return () => {
      const current = playerRef.current?.getCurrentTime?.();
      if (current) saveProgress(eventId, current);
    };
  }, [eventId]);

  const handleReady: ReactPlayerProps['onReady'] = () => {
    const t = loadProgress(eventId);
    if (t != null) {
      playerRef.current?.seekTo(t, 'seconds');
    }
    setLoaded(true);
    onReady?.();
  };

  return (
    <div ref={ref} className="relative aspect-video w-full" onClick={() => setSelectedVideo(eventId)}>
      {!loaded && !error && <PlaceholderVideo className="absolute inset-0" />}
      {error && <VideoFallback posterUrl={posterUrl} message={error} />}
      <ReactPlayer
        ref={playerRef}
        url={manifestUrl || videoUrl}
        playing={playing}
        muted={muted}
        width="100%"
        height="100%"
        playsinline
        config={{ file: { forceHLS: !!manifestUrl } }}
        onReady={handleReady}
        onError={(e) => {
          const msg = typeof e === 'string' ? e : 'Playback error';
          setError(msg);
        }}
        onProgress={({ playedSeconds }) => saveProgress(eventId, playedSeconds)}
        onEnded={() => {
          clearProgress(eventId);
          setPlaying(false);
        }}
      />
      {muted ? (
        <button
          type="button"
          className="absolute bottom-4 right-4 z-10"
          onClick={() => setMuted(false)}
        >
          Unmute
        </button>
      ) : (
        <button
          type="button"
          className="absolute bottom-4 right-4 z-10"
          onClick={() => setMuted(true)}
        >
          Mute
        </button>
      )}
    </div>
  );
};

export default VideoCardReactPlayer;

