"use client";
import { useEffect, useRef, useState } from "react";
import { Virtuoso } from "react-virtuoso";
import PlaceholderVideo from "./PlaceholderVideo";
import AutoSizer from "./AutoSizer";

export default function VideoFeed({
  onAuthorClick,
  videos = [],
}: {
  onAuthorClick: (pubkey: string) => void;
  videos?: string[];
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const handleScroll = () => {
      const next = Math.round(scroller.scrollTop / scroller.clientHeight);
      setIndex((prev) => (next !== prev ? next : prev));
    };

    scroller.addEventListener("scroll", handleScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const els = scroller.querySelectorAll("video");
    els.forEach((el, i) => {
      const video = el as HTMLVideoElement;
      if (i === index) {
        const playPromise = video.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(() => {});
        }
      } else {
        video.pause();
      }
    });
  }, [index]);

  if (videos.length === 0) {
    return (
      <div className="flex-1 min-h-0">
        <PlaceholderVideo
          className="mx-auto h-screen w-full text-primary h-safe-screen"
          message="No videos yet"
          busy={false}
        />
      </div>
    );
  }

  return (
    <AutoSizer className="flex-1 min-h-0 overflow-hidden">
      {({ width, height }) => (
        <Virtuoso
          data={videos}
          style={{ width, height }}
          className="relative h-full w-full overflow-auto overscroll-contain snap-y snap-mandatory"
          scrollerRef={(ref) => {
            scrollerRef.current = ref as HTMLDivElement | null;
          }}
          itemContent={(i, video) => (
            <div className="snap-start h-full w-full">
              <video
                className="h-full w-full"
                src={video as string}
                playsInline
                muted
              />
            </div>
          )}
        />
      )}
    </AutoSizer>
  );
}
