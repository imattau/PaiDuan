import React from 'react';
import Feed from '../components/Feed';
import { VideoCardProps } from '../components/VideoCard';

const items: VideoCardProps[] = [
  {
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    author: 'bunny',
    caption: 'Big Buck Bunny',
    eventId: '1',
    onLike: () => console.log('like 1'),
    onZap: () => console.log('zap 1'),
  },
  {
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    author: 'elephant',
    caption: 'Elephant Dream',
    eventId: '2',
    onLike: () => console.log('like 2'),
    onZap: () => console.log('zap 2'),
  },
  {
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    author: 'joyride',
    caption: 'Joyrides',
    eventId: '3',
    onLike: () => console.log('like 3'),
    onZap: () => console.log('zap 3'),
  },
];

export default function FeedPage() {
  return <Feed items={items} />;
}
