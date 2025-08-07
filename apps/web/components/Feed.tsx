import React, { useEffect, useState } from 'react';
import { useSpring, animated, useGesture } from '@paiduan/ui';
import { VideoCard, VideoCardProps } from './VideoCard';
import EmptyState from './EmptyState';

interface FeedProps {
  items: VideoCardProps[];
}

export const Feed: React.FC<FeedProps> = ({ items }) => {
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

  if (items.length === 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-white">
        <EmptyState />
        <p className="mt-4">Be the first to upload!</p>
      </div>
    );
  }

  return (
    <div {...bind()} className="relative h-screen w-screen overflow-hidden">
      <animated.div
        style={{ transform: y.to((py) => `translateY(${py}%)`) }}
        className="h-full w-full"
      >
        {items.map((item, i) => (
          <div key={i} className="h-screen w-screen">
            <VideoCard {...item} />
          </div>
        ))}
      </animated.div>
    </div>
  );
};

export default Feed;
