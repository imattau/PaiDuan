import initHls from '../hooks/useAdaptiveSource';
import type { ErrorData } from 'hls.js';

export type PlaybackState = 'playing' | 'paused';

type Listener = (state: PlaybackState) => void;
type ErrorListener = (message: string, data: ErrorData) => void;

let video: HTMLVideoElement | null = null;
let hls: ReturnType<typeof initHls> | null = null;
const listeners = new Set<Listener>();
const errorListeners = new Set<ErrorListener>();

function emit(state: PlaybackState) {
  for (const l of listeners) l(state);
}

function emitError(message: string, data: ErrorData) {
  for (const l of errorListeners) l(message, data);
}

function loadSource(
  el: HTMLVideoElement,
  { videoUrl, manifestUrl }: { videoUrl: string; manifestUrl?: string },
) {
  if (video) {
    video.removeEventListener('play', handlePlay);
    video.removeEventListener('pause', handlePause);
    video.pause();
    video.removeAttribute('src');
    // Force the browser to stop loading the previous source
    video.load();
  }
  hls?.destroy();
  video = el;
  if (manifestUrl) {
    hls = initHls(manifestUrl, el, (data) => {
      emitError(data.error.message, data);
    });
  } else {
    el.src = videoUrl;
  }
  el.addEventListener('play', handlePlay);
  el.addEventListener('pause', handlePause);
}

function handlePlay() {
  emit('playing');
}

function handlePause() {
  emit('paused');
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
