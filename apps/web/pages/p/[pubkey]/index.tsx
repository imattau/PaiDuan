import { useRouter } from 'next/router';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { SimplePool } from 'nostr-tools/pool';
import type { Event as NostrEvent } from 'nostr-tools/pure';
import type { Filter } from 'nostr-tools/filter';
import { toast } from 'react-hot-toast';
import VideoCard, { VideoCardProps } from '../../../components/VideoCard';
import useFollowing, { getFollowers } from '../../../hooks/useFollowing';
import SearchBar from '../../../components/SearchBar';
import { useAuth } from '@/hooks/useAuth';
import { getRelays } from '@/lib/nostr';

export default function ProfilePage() {
  const router = useRouter();
  const { pubkey } = router.query as { pubkey?: string };
  const poolRef = useRef<SimplePool>();
  const { state } = useAuth();
  const [name, setName] = useState('');
  const [picture, setPicture] = useState('');
  const [bio, setBio] = useState('');
  const [zapSplits, setZapSplits] = useState<{ lnaddr: string; pct: number }[]>([]);
  const [myPubkey, setMyPubkey] = useState('');
  const [videos, setVideos] = useState<VideoCardProps[]>([]);
  const [selected, setSelected] = useState<VideoCardProps | null>(null);
  const { following, follow, unfollow } = useFollowing();
  const [followers, setFollowers] = useState(0);

  const isFollowing = pubkey ? following.includes(pubkey) : false;

  const isOwner = pubkey === myPubkey;

  useEffect(() => {
    if (!pubkey) return;
    setFollowers(getFollowers(pubkey));
  }, [pubkey]);

  useEffect(() => {
    if (state.status === 'ready') setMyPubkey(state.pubkey);
  }, [state]);

  useEffect(() => {
    if (!pubkey) return;
    const pool = (poolRef.current ||= new SimplePool());
    const relays = getRelays();

    const metaSub = pool.subscribeMany(
      relays,
      [{ kinds: [0], authors: [pubkey], limit: 1 } as Filter],
      {
        onevent: (ev: NostrEvent) => {
          try {
            const content = JSON.parse(ev.content);
            setName(content.name || '');
            setPicture(content.picture || '');
            setBio(content.about || '');
            if (Array.isArray(content.zapSplits)) {
              setZapSplits(
                content.zapSplits
                  .filter((s: any) => typeof s.lnaddr === 'string' && typeof s.pct === 'number')
                  .slice(0, 4),
              );
            }
          } catch {
            /* ignore */
          }
        },
      },
    );

    const nextVideos: VideoCardProps[] = [];
    const videoSub = pool.subscribeMany(
      relays,
      [{ kinds: [30023], authors: [pubkey], limit: 100 } as Filter],
      {
        onevent: (ev: NostrEvent) => {
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
        },
      },
    );

    return () => {
      metaSub.close();
      videoSub.close();
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

  const totalPct = zapSplits.reduce((sum, s) => sum + s.pct, 0);

  const addSplit = () => {
    if (zapSplits.length >= 4) return;
    setZapSplits([...zapSplits, { lnaddr: '', pct: 0 }]);
  };

  const updateSplit = (idx: number, key: 'lnaddr' | 'pct', value: string) => {
    const next = [...zapSplits];
    if (key === 'pct') {
      next[idx].pct = Number(value);
    } else {
      next[idx].lnaddr = value;
    }
    setZapSplits(next);
  };

  const removeSplit = (idx: number) => {
    const next = [...zapSplits];
    next.splice(idx, 1);
    setZapSplits(next);
  };

  const saveSplits = async () => {
    try {
      if (state.status !== 'ready') throw new Error('signer required');
      const content: any = { name, picture, about: bio };
      if (zapSplits.length) content.zapSplits = zapSplits;
      const event: any = {
        kind: 0,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: JSON.stringify(content),
        pubkey: state.pubkey,
      };
      const signed = await state.signer.signEvent(event);
      const pool = (poolRef.current ||= new SimplePool());
      await pool.publish(getRelays(), signed);
      toast.success('Revenue share updated');
    } catch (err) {
      console.error(err);
      toast.error('Update failed');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-12">
      <SearchBar />
      <div className="h-32 w-full bg-gray-700" />
      <div className="p-4 -mt-12 flex items-start space-x-4">
        <Image
          src={picture || '/placeholder.png'}
          alt={name}
          width={96}
          height={96}
          className="h-24 w-24 rounded-full border-4 border-black object-cover"
          unoptimized
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

      {isOwner && (
        <div className="p-4">
          <div className="mb-2 text-lg font-semibold">Revenue Share</div>
          {zapSplits.map((s, i) => (
            <div key={i} className="mb-2 flex items-center space-x-2">
              <input
                value={s.lnaddr}
                onChange={(e) => updateSplit(i, 'lnaddr', e.target.value)}
                placeholder="ln@addr"
                className="flex-1 rounded border px-2 py-1 bg-white text-black"
              />
              <input
                type="number"
                min={0}
                max={95}
                value={s.pct}
                onChange={(e) => updateSplit(i, 'pct', e.target.value)}
                className="w-20 rounded border px-2 py-1 bg-white text-black"
              />
              <button onClick={() => removeSplit(i)} className="text-sm underline">
                remove
              </button>
            </div>
          ))}
          {zapSplits.length < 4 && totalPct < 95 && (
            <button
              onClick={addSplit}
              className="mb-2 rounded border px-2 py-1 text-sm"
            >
              Add collaborator
            </button>
          )}
          <div className="mb-2 text-sm">Total {totalPct}% / 95%</div>
          <button
            onClick={saveSplits}
            disabled={totalPct > 95}
            className="rounded bg-blue-500 px-3 py-1 text-sm disabled:opacity-50"
          >
            Save
          </button>
        </div>
      )}

      <div className="p-4 grid grid-cols-2 gap-4">
        {videos.map((v) =>
          v.posterUrl ? (
            <Image
              key={v.eventId}
              src={v.posterUrl}
              alt="poster"
              width={1920}
              height={1080}
              className="w-full aspect-video object-cover cursor-pointer"
              onClick={() => setSelected(v)}
              unoptimized
            />
          ) : (
            <div
              key={v.eventId}
              className="w-full aspect-video bg-foreground/20 cursor-pointer"
              onClick={() => setSelected(v)}
            />
          ),
        )}
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

