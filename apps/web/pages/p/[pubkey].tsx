import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { SimplePool, Event as NostrEvent, Filter } from 'nostr-tools';
import VideoCard, { VideoCardProps } from '../../components/VideoCard';
import useFollowing, { getFollowers } from '../../hooks/useFollowing';
import SearchBar from '../../components/SearchBar';

function relayList(): string[] {
  if (typeof window === 'undefined') return ['wss://relay.damus.io', 'wss://nos.lol'];
  const nostr = (window as any).nostr;
  if (nostr?.getRelays) {
    try {
      const relays = nostr.getRelays();
      if (Array.isArray(relays)) return relays;
      if (relays && typeof relays === 'object') return Object.keys(relays);
    } catch {
      /* ignore */
    }
  }
  return ['wss://relay.damus.io', 'wss://nos.lol'];
}

export default function ProfilePage() {
  const router = useRouter();
  const { pubkey } = router.query as { pubkey?: string };
  const poolRef = useRef<SimplePool>();
  const [name, setName] = useState('');
  const [picture, setPicture] = useState('');
  const [bio, setBio] = useState('');
  const [videos, setVideos] = useState<VideoCardProps[]>([]);
  const [selected, setSelected] = useState<VideoCardProps | null>(null);
  const { following, follow, unfollow } = useFollowing();
  const [followers, setFollowers] = useState(0);

  const isFollowing = pubkey ? following.includes(pubkey) : false;

  useEffect(() => {
    if (!pubkey) return;
    setFollowers(getFollowers(pubkey));
  }, [pubkey]);

  useEffect(() => {
    if (!pubkey) return;
    const pool = (poolRef.current ||= new SimplePool());
    const relays = relayList();

    const metaSub = pool.sub(relays, [
      { kinds: [0], authors: [pubkey], limit: 1 } as Filter,
    ]);
    metaSub.on('event', (ev: NostrEvent) => {
      try {
        const content = JSON.parse(ev.content);
        setName(content.name || '');
        setPicture(content.picture || '');
        setBio(content.about || '');
      } catch {
        /* ignore */
      }
    });

    const videoSub = pool.sub(relays, [
      { kinds: [30023], authors: [pubkey], limit: 100 } as Filter,
    ]);
    const nextVideos: VideoCardProps[] = [];
    videoSub.on('event', (ev: NostrEvent) => {
      const videoTag = ev.tags.find((t) => t[0] === 'v');
      if (!videoTag) return;
      const posterTag = ev.tags.find((t) => t[0] === 'image');
      const manifestTag = ev.tags.find((t) => t[0] === 'vman');
      const zapTag = ev.tags.find((t) => t[0] === 'zap');
      const tTags = ev.tags.filter((t) => t[0] === 't').map((t) => t[1]);
      nextVideos.push({
        videoUrl: videoTag[1],
        posterUrl: posterTag ? posterTag[1] : undefined,
        manifestUrl: manifestTag ? manifestTag[1] : undefined,
        author: ev.pubkey.slice(0, 8),
        caption: tTags.join(' '),
        eventId: ev.id,
        lightningAddress: zapTag ? zapTag[1] : '',
        pubkey: ev.pubkey,
        zapTotal: 0,
        onLike: () => {},
      });
      setVideos([...nextVideos]);
    });

    return () => {
      metaSub.unsub();
      videoSub.unsub();
    };
  }, [pubkey]);

  const handleFollow = () => {
    if (!pubkey) return;
    if (isFollowing) {
      unfollow(pubkey);
    } else {
      follow(pubkey);
    }
    setFollowers(getFollowers(pubkey));
  };

  return (
    <div className="min-h-screen bg-black text-white pt-12">
      <SearchBar />
      <div className="h-32 w-full bg-gray-700" />
      <div className="p-4 -mt-12 flex items-start space-x-4">
        <img
          src={picture || '/placeholder.png'}
          alt={name}
          className="h-24 w-24 rounded-full border-4 border-black object-cover"
        />
        <div className="flex-1">
          <div className="text-2xl font-semibold">
            {name || pubkey?.slice(0, 8)}
          </div>
          <div className="text-sm whitespace-pre-line">{bio}</div>
          <div className="mt-2 flex items-center space-x-4">
            <button
              onClick={handleFollow}
              className="rounded bg-blue-500 px-3 py-1 text-sm"
            >
              {isFollowing ? 'Unfollow' : 'Follow'}
            </button>
            <div className="text-sm">{followers} followers</div>
          </div>
        </div>
      </div>

      <div className="p-4 grid grid-cols-2 gap-4">
        {videos.map((v) => (
          <img
            key={v.eventId}
            src={v.posterUrl || ''}
            alt="poster"
            className="w-full aspect-video object-cover cursor-pointer"
            onClick={() => setSelected(v)}
          />
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
          <div className="relative h-full w-full">
            <VideoCard {...selected} />
            <button
              className="absolute right-4 top-4 text-white"
              onClick={() => setSelected(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

