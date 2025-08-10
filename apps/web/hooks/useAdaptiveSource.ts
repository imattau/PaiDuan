import { useEffect, useState } from 'react';
import type videojs from 'video.js';
import useAlwaysSD from './useAlwaysSD';

export default function useAdaptiveSource(
  manifestUrl: string | undefined,
  playerRef: React.RefObject<videojs.Player | null>,
) {
  const { alwaysSD } = useAlwaysSD();
  const [src, setSrc] = useState<string>();

  useEffect(() => {
    if (!manifestUrl) return;
    let cancelled = false;
    let id: ReturnType<typeof setInterval> | undefined;
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
        id = setInterval(() => {
          const videoEl = playerRef.current?.el()?.getElementsByTagName('video')[0] as
            | HTMLVideoElement
            | undefined;
          if (!videoEl || !videoEl.getVideoPlaybackQuality) return;
          const q = videoEl.getVideoPlaybackQuality();
          const total = q.totalVideoFrames;
          const dropped = q.droppedVideoFrames;
          const deltaTotal = total - lastTotal;
          const deltaDropped = dropped - lastDropped;
          lastTotal = total;
          lastDropped = dropped;
          const rate = deltaTotal > 0 ? deltaDropped / deltaTotal : 0;
          if (rate > 0.05 && current > 0) {
            const t = videoEl.currentTime;
            current -= 1;
            setSrc(manifest[order[current]]);
            stable = 0;
            setTimeout(() => {
              const player = playerRef.current;
              if (player) player.currentTime(t);
            }, 500);
          } else if (rate <= 0.05) {
            stable += 5;
            if (stable >= 15 && current < order.length - 1) {
              const t = videoEl.currentTime;
              current += 1;
              setSrc(manifest[order[current]]);
              stable = 0;
              setTimeout(() => {
                const player = playerRef.current;
                if (player) player.currentTime(t);
              }, 500);
            }
          } else {
            stable = 0;
          }
        }, 5000);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('failed to load adaptive manifest', err);
        setSrc(undefined);
      });
    return () => {
      clearInterval(id);
      cancelled = true;
    };
  }, [manifestUrl, playerRef, alwaysSD]);

  return src;
}
