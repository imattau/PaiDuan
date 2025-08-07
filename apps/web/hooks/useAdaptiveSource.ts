import { useEffect, useState } from 'react';
import ReactPlayer from 'react-player';
import useAlwaysSD from './useAlwaysSD';

export default function useAdaptiveSource(
  manifestUrl: string | undefined,
  playerRef: React.RefObject<ReactPlayer>,
) {
  const { alwaysSD } = useAlwaysSD();
  const [src, setSrc] = useState<string>();

  useEffect(() => {
    if (!manifestUrl) return;
    let cancelled = false;
    fetch(manifestUrl)
      .then((r) => r.json())
      .then((manifest) => {
        if (cancelled) return;
        const order = ['240', '480', '720'];
        let current = alwaysSD ? 0 : 1; // start at 480p
        let stable = 0;
        setSrc(manifest[order[current]]);
        if (alwaysSD) return;
        let lastTotal = 0;
        let lastDropped = 0;
        const interval = setInterval(() => {
          const video = playerRef.current?.getInternalPlayer() as HTMLVideoElement | undefined;
          if (!video || !video.getVideoPlaybackQuality) return;
          const q = video.getVideoPlaybackQuality();
          const total = q.totalVideoFrames;
          const dropped = q.droppedVideoFrames;
          const deltaTotal = total - lastTotal;
          const deltaDropped = dropped - lastDropped;
          lastTotal = total;
          lastDropped = dropped;
          const rate = deltaTotal > 0 ? deltaDropped / deltaTotal : 0;
          if (rate > 0.05 && current > 0) {
            const t = video.currentTime;
            current -= 1;
            setSrc(manifest[order[current]]);
            stable = 0;
            setTimeout(() => {
              const v = playerRef.current?.getInternalPlayer() as HTMLVideoElement | undefined;
              if (v) v.currentTime = t;
            }, 500);
          } else if (rate <= 0.05) {
            stable += 5;
            if (stable >= 15 && current < order.length - 1) {
              const t = video.currentTime;
              current += 1;
              setSrc(manifest[order[current]]);
              stable = 0;
              setTimeout(() => {
                const v = playerRef.current?.getInternalPlayer() as HTMLVideoElement | undefined;
                if (v) v.currentTime = t;
              }, 500);
            }
          } else {
            stable = 0;
          }
        }, 5000);
        return () => clearInterval(interval);
      });
    return () => {
      cancelled = true;
    };
  }, [manifestUrl, playerRef, alwaysSD]);

  return src;
}
