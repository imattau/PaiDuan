import React from 'react';
import Feed from '../components/Feed';
import { VideoCardProps } from '../components/VideoCard';

const items: VideoCardProps[] = [
  {
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    author: 'bunny',
    caption: 'Big Buck Bunny',
    eventId: '1',
    lightningAddress: 'hello@getalby.com',
    pubkey: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    zapTotal: 0,
    onLike: () => console.log('like 1'),
  },
  {
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    author: 'elephant',
    caption: 'Elephant Dream',
    eventId: '2',
    lightningAddress: 'hello@getalby.com',
    pubkey: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    zapTotal: 0,
    onLike: () => console.log('like 2'),
  },
  {
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    author: 'joyride',
    caption: 'Joyrides',
    eventId: '3',
    lightningAddress: 'hello@getalby.com',
    pubkey: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    zapTotal: 0,
    onLike: () => console.log('like 3'),
  },
];

export default function FeedPage() {
  return <Feed items={items} />;
}
