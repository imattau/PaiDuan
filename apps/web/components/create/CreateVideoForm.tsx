'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import PlaceholderVideo from '../PlaceholderVideo';
import { trimVideoWebCodecs } from '../../utils/trimVideoWebCodecs';
import { SimplePool } from 'nostr-tools/pool';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { useProfiles } from '../../hooks/useProfiles';
import useFollowing from '../../hooks/useFollowing';
import { getRelays } from '../../lib/nostr';

export default function CreateVideoForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [outBlob, setOutBlob] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);

  const updatePreview = (url: string | null) => {
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  };

  const [caption, setCaption] = useState('');
  const [topics, setTopics] = useState('');
  const [license, setLicense] = useState('All Rights Reserved');
  const [customLicense, setCustomLicense] = useState('');
  const [nsfw, setNsfw] = useState(false);
  const [lightningAddress, setLightningAddress] = useState('');
  const [zapSplits, setZapSplits] = useState<{ lnaddr: string; pct: number }[]>([]);
  const [posting, setPosting] = useState(false);

  const { state } = useAuth();
  const profile = useProfile(state.status === 'ready' ? state.pubkey : undefined);
  const { following } = useFollowing(state.status === 'ready' ? state.pubkey : undefined);
  const profiles = useProfiles(following);

  const walletAddrs = Array.isArray(profile?.wallets)
    ? [
        ...profile.wallets.filter((w: any) => w?.default).map((w: any) => w.lnaddr),
        ...profile.wallets.filter((w: any) => !w?.default).map((w: any) => w.lnaddr),
      ]
    : profile?.lud16
      ? [profile.lud16]
      : [];
  const zapOptions = Array.from(
    new Set([
      ...walletAddrs,
      ...(Array.isArray(profile?.zapSplits)
        ? profile.zapSplits.map((s: any) => s?.lnaddr).filter(Boolean)
        : []),
    ]),
  );
  const showZapSelect =
    (profile?.zapSplits && profile.zapSplits.length > 0) || zapOptions.length > 1;
  const selectedZapOption = zapOptions.includes(lightningAddress) ? lightningAddress : '';

  useEffect(() => {
    if (!lightningAddress) {
      const def = Array.isArray(profile?.wallets)
        ? profile.wallets.find((w: any) => w?.default)?.lnaddr
        : profile?.lud16;
      if (def) setLightningAddress(def);
    }
  }, [profile, lightningAddress]);

  useEffect(() => {
    if (Array.isArray(profile?.zapSplits)) {
      setZapSplits(
        profile.zapSplits
          .filter((s: any) => typeof s.lnaddr === 'string' && typeof s.pct === 'number')
          .slice(0, 4),
      );
    }
  }, [profile]);

  const topicList = topics
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  const totalPct = zapSplits.reduce((sum, s) => sum + s.pct, 0);
  const splitsValid = totalPct <= 95 && zapSplits.every((s) => s.lnaddr && s.pct > 0);
  const formValid =
    !!outBlob && !!lightningAddress.trim() && topicList.length > 0 && splitsValid;

  useEffect(() => {
    if (videoRef.current && preview) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setOutBlob(null);
    updatePreview(f ? URL.createObjectURL(f) : null);
    setProgress(0);
    if (f) {
      setErr(null);
      try {
        // Load video metadata to obtain dimensions before trimming
        const video = document.createElement('video');
        video.preload = 'metadata';
        const url = URL.createObjectURL(f);
        await new Promise<void>((resolve, reject) => {
          video.onloadedmetadata = () => resolve();
          video.onerror = () => reject(new Error('Failed to load video metadata'));
          video.src = url;
        });

        const worker = trimVideoWebCodecs(f, {
          start: 0,
          width: video.videoWidth,
          height: video.videoHeight,
        });
        URL.revokeObjectURL(url);
        video.remove();
        if (!worker) {
          setErr('Video trimming not supported in this browser');
          return;
        }
        worker.onmessage = (ev: MessageEvent) => {
          const msg = ev.data as any;
          if (msg?.type === 'progress') {
            setProgress(Math.round((msg.progress || 0) * 100));
          } else if (msg?.type === 'error') {
            setErr(msg.message || 'Conversion failed.');
            setProgress(0);
            worker.terminate();
          } else if (msg?.type === 'done') {
            const blob: Blob = msg.blob;
            setOutBlob(blob);
            updatePreview(URL.createObjectURL(blob));
            worker.terminate();
          }
        };
      } catch (e) {
        console.error(e);
        setErr('Conversion failed.');
        setProgress(0);
      }
    }
  }

  async function postVideo() {

    if (!outBlob) {
      alert('Please process a video first');
      return;
    }
    if (!lightningAddress.trim()) {
      alert('Lightning address is required');
      return;
    }
    if (topicList.length === 0) {
      alert('At least one topic is required');
      return;
    }

    try {
      setPosting(true);
      const form = new FormData();
      form.append('file', outBlob, 'video.webm');
      form.append('caption', caption);
      form.append('topics', topics);
      const licenseValue = license === 'other' ? customLicense : license;
      form.append('copyright', licenseValue);
      form.append('nsfw', nsfw ? 'true' : 'false');
      if (lightningAddress) form.append('zap', lightningAddress);
      if (zapSplits.length) form.append('zapSplits', JSON.stringify(zapSplits));

      const res = await fetch('https://nostr.media/api/upload', {
        method: 'POST',
        body: form,
      });
      if (!res.ok) throw new Error('Upload failed');
      const { video, poster, manifest } = await res.json();

      const tags: string[][] = [
        ['v', video],
        ['image', poster],
        ['vman', manifest],
        ...topicList.map((t) => ['t', t]),
      ];
      const creatorPct = Math.max(0, 100 - totalPct);
      if (lightningAddress)
        tags.push(['zap', lightningAddress, creatorPct.toString()]);
      zapSplits.forEach((s) => {
        if (s.lnaddr && s.pct > 0) tags.push(['zap', s.lnaddr, s.pct.toString()]);
      });
      if (nsfw) tags.push(['nsfw', 'true']);
      if (licenseValue) tags.push(['copyright', licenseValue]);

      if (state.status !== 'ready') throw new Error('signer required');
      const event: any = {
        kind: 30023,
        created_at: Math.floor(Date.now() / 1000),
        content: caption,
        tags,
        pubkey: state.pubkey,
      };

      const signed = await state.signer.signEvent(event);
      const pool = new SimplePool();
      pool.publish(getRelays(), signed);
      alert('Posted to Nostr');
    } catch (e: any) {
      alert(e.message || 'Failed to post');
    } finally {
      setPosting(false);
    }
  }

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

  function handleCancel() {
    if (
      (file ||
        outBlob ||
        preview ||
        caption ||
        topics ||
        license !== 'All Rights Reserved' ||
        customLicense ||
        nsfw ||
        lightningAddress ||
        zapSplits.length > 0) &&
      !confirm('Discard your progress?')
    )
      return;
    router.back();
  }

  const form = (
    <>
      <input
        type="text"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Caption"
        className="block w-full text-sm rounded-md border border-border bg-transparent px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      />
      <input
        type="text"
        value={topics}
        onChange={(e) => setTopics(e.target.value)}
        placeholder="Topic tags (comma separated)"
        className="block w-full text-sm rounded-md border border-border bg-transparent px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      />
      <label className="block text-sm">
        <span className="mb-1 block">Lightning address</span>
        {showZapSelect && (
          <select
            value={selectedZapOption}
            onChange={(e) => setLightningAddress(e.target.value)}
            className="block w-full rounded-md border border-border bg-transparent px-3 py-2 mb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            {zapOptions.map((addr) => (
              <option key={addr} value={addr}>
                {addr}
              </option>
            ))}
            <option value="">Other...</option>
          </select>
        )}
        <input
          type="text"
          value={lightningAddress}
          onChange={(e) => setLightningAddress(e.target.value)}
          className="block w-full rounded-md border border-border bg-transparent px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        />
      </label>
      {zapSplits.map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            list="lnaddr-options"
            value={s.lnaddr}
            onChange={(e) => updateSplit(i, 'lnaddr', e.target.value)}
            placeholder="ln@addr"
            className="flex-1 text-sm rounded-md border border-border bg-transparent px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          />
          <input
            type="number"
            min={0}
            max={95}
            value={s.pct}
            onChange={(e) => updateSplit(i, 'pct', e.target.value)}
            className="w-20 text-sm rounded-md border border-border bg-transparent px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          />
          <button
            type="button"
            className="text-xs underline"
            onClick={() => removeSplit(i)}
          >
            remove
          </button>
        </div>
      ))}
      {zapSplits.length < 4 && totalPct < 95 && (
        <button
          type="button"
          onClick={addSplit}
          className="rounded border px-2 py-1 text-sm"
        >
          Add collaborator
        </button>
      )}
      {zapSplits.length > 0 && (
        <div className="text-sm">Total {totalPct}% / 95%</div>
      )}
      <datalist id="lnaddr-options">
        {following.map((pk) => {
          const p = profiles.get(pk);
          const addr = Array.isArray(p?.wallets)
            ? p.wallets.find((w: any) => w?.default)?.lnaddr
            : p?.lud16;
          return addr ? (
            <option key={pk} value={addr}>
              {addr}
            </option>
          ) : null;
        })}
      </datalist>
      <label className="block text-sm">
        <span className="mb-1 block">License</span>
        <select
          data-testid="license-select"
          value={license}
          onChange={(e) => setLicense(e.target.value)}
          className="block w-full rounded-md border border-border bg-transparent px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          <option value="All Rights Reserved">All Rights Reserved</option>
          <option value="CC0 (Public Domain)">CC0 (Public Domain)</option>
          <option value="CC BY">CC BY</option>
          <option value="CC BY-SA">CC BY-SA</option>
          <option value="CC BY-ND">CC BY-ND</option>
          <option value="CC BY-NC">CC BY-NC</option>
          <option value="CC BY-NC-SA">CC BY-NC-SA</option>
          <option value="CC BY-NC-ND">CC BY-NC-ND</option>
          <option value="other">Other...</option>
        </select>
        {license === 'other' && (
          <input
            data-testid="custom-license-input"
            type="text"
            value={customLicense}
            onChange={(e) => setCustomLicense(e.target.value)}
            placeholder="Custom license"
            className="mt-2 block w-full text-sm rounded-md border border-border bg-transparent px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          />
        )}
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={nsfw} onChange={(e) => setNsfw(e.target.checked)} />
        <span className="text-sm">NSFW</span>
      </label>
      <button
        className="btn btn-primary disabled:opacity-60"
        data-testid="publish-button"
        disabled={!formValid || posting}
        onClick={postVideo}
      >
        {posting ? 'Publishing…' : 'Publish'}
      </button>
    </>
  );

  return (
    <section className="w-full sm:max-w-4xl mx-auto rounded-2xl border border-border bg-white/5 dark:bg-neutral-900 p-6 space-y-4">
      <div className="flex items-center justify-end">
        <button className="text-sm text-muted" onClick={handleCancel}>
          Cancel
        </button>
      </div>
      <div className="flex flex-1 flex-wrap gap-4 items-start">
        <div className="space-y-4">
          <input
            type="file"
            accept="video/*"
            onChange={onPick}
            className="block w-full text-sm rounded-md border border-border bg-transparent px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          />
            {preview ? (
              <div className="relative aspect-[9/16] h-[70vh] w-full sm:max-w-sm overflow-hidden rounded-xl">
                <video
                  ref={videoRef}
                  controls
                  src={preview}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                {progress > 0 && progress < 100 && (
                  <div
                    className="absolute left-0 bottom-0 h-1 bg-blue-500"
                    style={{ width: `${progress}%` }}
                  />
                )}
              </div>
            ) : (
              <div className="relative aspect-[9/16] h-[70vh] w-full sm:max-w-sm overflow-hidden rounded-xl">
                <PlaceholderVideo className="absolute inset-0 h-full w-full object-cover" />
              </div>
            )}
          {err && <p className="text-sm text-red-500">{err}</p>}
        </div>
        <div className="space-y-4">{form}</div>
      </div>
    </section>
  );
}
