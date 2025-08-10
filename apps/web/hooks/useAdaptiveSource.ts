import Hls from 'hls.js';

export default function initHls(
  manifestUrl: string | undefined,
  video: HTMLVideoElement | null,
): Hls | null {
  if (!manifestUrl || !video) return null;

  if (Hls.isSupported()) {
    const hls = new Hls({ lowLatencyMode: true });
    hls.attachMedia(video);
    hls.loadSource(manifestUrl);
    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            hls.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            hls.recoverMediaError();
            break;
          default:
            hls.destroy();
            break;
        }
      }
    });
    return hls;
  }

  if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = manifestUrl;
  }

  return null;
}
