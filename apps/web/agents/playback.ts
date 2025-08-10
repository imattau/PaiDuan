import initHls from '../hooks/useAdaptiveSource';

export type PlaybackState = 'playing' | 'paused';

type Listener = (state: PlaybackState) => void;

let video: HTMLVideoElement | null = null;
let hls: ReturnType<typeof initHls> | null = null;
const listeners = new Set<Listener>();

function emit(state: PlaybackState) {
  for (const l of listeners) l(state);
}

function loadSource(
  el: HTMLVideoElement,
  { videoUrl, manifestUrl }: { videoUrl: string; manifestUrl?: string },
) {
  if (video) {
    video.removeEventListener('play', handlePlay);
    video.removeEventListener('pause', handlePause);
  }
  hls?.destroy();
  video = el;
  if (manifestUrl) {
    hls = initHls(manifestUrl, el);
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

export const playback = { loadSource, play, pause, onStateChange };
export default playback;
