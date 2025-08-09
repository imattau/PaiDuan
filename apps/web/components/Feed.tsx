import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSpring, animated, useGesture } from '@paiduan/ui';
import { VideoCard, VideoCardProps } from './VideoCard';
import EmptyState from './EmptyState';
import { SkeletonVideoCard } from './ui/SkeletonVideoCard';
import Link from 'next/link';
import { useFeedSelection } from '@/store/feedSelection';

export const FEED_SPRING_CONFIG = { tension: 170, friction: 26 };

const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = () => setMatches(media.matches);
    listener();
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
};

interface FeedProps {
  items: VideoCardProps[];
  loading?: boolean;
  loadMore?: () => void;
  springConfig?: typeof FEED_SPRING_CONFIG;
}

export const Feed: React.FC<FeedProps> = ({
  items,
  loading,
  loadMore,
  springConfig = FEED_SPRING_CONFIG
}) => {
  const [index, setIndex] = useState(0);
  const [{ y }, api] = useSpring(() => ({ y: 0, config: springConfig }));

  const wheelOffset = useRef(0);
  const isTransitioning = useRef(false);
  const setSelectedVideo = useFeedSelection((s) => s.setSelectedVideo);
  const selectedVideoId = useFeedSelection((s) => s.selectedVideoId);
  const showControls = useMediaQuery('(min-width: 768px)');

  const next = useCallback(() => {
    setIndex((i) => {
      if (i < items.length - 1) {
        isTransitioning.current = true;
        return i + 1;
      }
      return i;
    });
  }, [items.length]);

  const prev = useCallback(() => {
    setIndex((i) => {
      if (i > 0) {
        isTransitioning.current = true;
        return i - 1;
      }
      return i;
    });
  }, []);

  const bind = useGesture(
    {
      onDrag: ({ down, movement: [, my], cancel }) => {
        if (!down || isTransitioning.current) return;
        if (my < -50 && index < items.length - 1) {
          next();
          cancel();
        }
        if (my > 50 && index > 0) {
          prev();
          cancel();
        }
      },
      onWheel: ({ event, delta: [, dy] }) => {
        event.preventDefault();
        if (isTransitioning.current) return;
        wheelOffset.current += dy;
        if (wheelOffset.current > 50) {
          if (index < items.length - 1) {
            next();
          }
          wheelOffset.current -= 50;
        } else if (wheelOffset.current < -50) {
          if (index > 0) {
            prev();
          }
          wheelOffset.current += 50;
        }
      },
    },
    { drag: { axis: 'y' }, wheel: { eventOptions: { passive: false } } }
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowDown', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        next();
      } else if (['ArrowUp', 'ArrowLeft'].includes(e.key)) {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [next, prev]);

  useEffect(() => {
    if (index >= items.length - 2) {
      loadMore?.();
    }
  }, [index, items.length, loadMore]);

  useEffect(() => {
    if (items[index] && items[index].eventId !== selectedVideoId) {
      setSelectedVideo(items[index].eventId, items[index].pubkey);
    }
  }, [index, items, setSelectedVideo, selectedVideoId]);

  if (loading) {
    return (
      <div className="h-full w-full">
        <SkeletonVideoCard />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center text-white">
        <EmptyState />
        <Link href="/create" className="btn btn-primary mt-4" prefetch>
          Upload your first video
        </Link>
      </div>
    );
  }

  return (
    <div {...bind()} className="relative h-full w-full overflow-hidden touch-none">
      <animated.div
        style={{ transform: y.to((py) => `translateY(${py}%)`) }}
        className="h-full w-full"
      >
        {items.map((item, i) => (
          <div key={i} className="h-full w-full">
            <VideoCard {...item} showMenu />
          </div>
        ))}
      </animated.div>
      {showControls && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}

          >
            Previous
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}

          >
            Next
          </button>
        </>
      )}
    </div>
  );
};

export default Feed;
