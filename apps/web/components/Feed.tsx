import React, { useEffect, useState } from 'react';
import { useSpring, animated, useGesture } from '@paiduan/ui';
import { VideoCard, VideoCardProps } from './VideoCard';
import EmptyState from './EmptyState';
import { SkeletonVideoCard } from './ui/SkeletonVideoCard';
import Link from 'next/link';

interface FeedProps {
  items: VideoCardProps[];
  loading?: boolean;
}

export const Feed: React.FC<FeedProps> = ({ items, loading }) => {
  const [index, setIndex] = useState(0);
  const [{ y }, api] = useSpring(() => ({ y: 0 }));

  const bind = useGesture(
    {
      onDrag: ({ down, movement: [, my], direction: [, dy], cancel }) => {
        if (!down) return;
        if (my < -50 && index < items.length - 1) {
          setIndex((i) => i + 1);
          cancel();
        }
        if (my > 50 && index > 0) {
          setIndex((i) => i - 1);
          cancel();
        }
      },
    },
    { drag: { axis: 'y' } },
  );

  useEffect(() => {
    api.start({ y: -index * 100 });
  }, [index]);

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
        <Link href="/create" className="btn btn-primary mt-4">
          Upload your first video
        </Link>
      </div>
    );
  }

  return (
    <div {...bind()} className="relative h-full w-full overflow-hidden">
      <animated.div
        style={{ transform: y.to((py) => `translateY(${py}%)`) }}
        className="h-full w-full"
      >
        {items.map((item, i) => (
          <div key={i} className="h-full w-full">
            <VideoCard {...item} />
          </div>
        ))}
      </animated.div>
    </div>
  );
};

export default Feed;
