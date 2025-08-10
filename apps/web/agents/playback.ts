import initHls from '../hooks/useAdaptiveSource';
import type { ErrorData } from 'hls.js';

export type PlaybackState = 'playing' | 'paused';

type Listener = (state: PlaybackState) => void;
type ErrorListener = (message: string, data: ErrorData) => void;

let video: HTMLVideoElement | null = null;
let hls: ReturnType<typeof initHls> | null = null;
let currentEventId: string | null = null;
const listeners = new Set<Listener>();
const errorListeners = new Set<ErrorListener>();

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

function saveProgress() {
  if (!video || !currentEventId) return;
  const store = loadStore();
  store[currentEventId] = { currentTime: video.currentTime, timestamp: Date.now() };
  saveStore(store);
}

function clearProgress(eventId: string) {
  const store = loadStore();
  if (eventId in store) {
    delete store[eventId];
    saveStore(store);
  }
}

function emit(state: PlaybackState) {
  for (const l of listeners) l(state);
}

function emitError(message: string, data: ErrorData) {
  for (const l of errorListeners) l(message, data);
}

function loadSource(
  el: HTMLVideoElement,
  {
    videoUrl,
    manifestUrl,
    eventId,
  }: { videoUrl: string; manifestUrl?: string; eventId: string },
) {
  if (video) {
    video.removeEventListener('play', handlePlay);
    video.removeEventListener('pause', handlePause);
    video.removeEventListener('ended', handleEnded);
    saveProgress();
    video.pause();
    video.removeAttribute('src');
    // Force the browser to stop loading the previous source
    try {
      video.load();
    } catch {
      // no-op in environments without full media support
    }
  }
  hls?.destroy();
  video = el;
  currentEventId = eventId;
  if (manifestUrl) {
    hls = initHls(manifestUrl, el, (data) => {
      emitError(data.error.message, data);
    });
  } else {
    el.src = videoUrl;
  }
  el.addEventListener('play', handlePlay);
  el.addEventListener('pause', handlePause);
  el.addEventListener('ended', handleEnded);
  el.addEventListener(
    'loadedmetadata',
    () => {
      const t = loadProgress(eventId);
      if (t != null) el.currentTime = t;
    },
    { once: true },
  );
}

function handlePlay() {
  emit('playing');
}

function handlePause() {
  emit('paused');
  saveProgress();
}

function handleEnded() {
  emit('paused');
  if (currentEventId) clearProgress(currentEventId);
}

function play() {
  return video?.play();
}

function pause() {
  video?.pause();
}

function onStateChange(cb: Listener) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function onError(cb: ErrorListener) {
  errorListeners.add(cb);
  return () => errorListeners.delete(cb);
}

export const playback = { loadSource, play, pause, onStateChange, onError };
export default playback;
