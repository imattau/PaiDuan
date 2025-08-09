'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PlaceholderVideo from '../PlaceholderVideo';
import { trimVideoWebCodecs } from '../../utils/trimVideoWebCodecs';
import { SimplePool } from 'nostr-tools/pool';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { getRelays } from '../../lib/nostr';

export default function CreateVideoForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [outBlob, setOutBlob] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const [caption, setCaption] = useState('');
  const [topics, setTopics] = useState('');
  const [copyright, setCopyright] = useState('');
  const [nsfw, setNsfw] = useState(false);
  const [lightningAddress, setLightningAddress] = useState('');
  const [posting, setPosting] = useState(false);

  const { state } = useAuth();
  const profile = useProfile(state.status === 'ready' ? state.pubkey : undefined);

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

  const topicList = topics
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  const formValid = !!outBlob && !!lightningAddress.trim() && topicList.length > 0;

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setOutBlob(null);
    setPreview(f ? URL.createObjectURL(f) : null);
    setProgress(0);
    if (f) {
      setErr(null);
      try {
        const blob = await trimVideoWebCodecs(f, 0, undefined, (p) =>
          setProgress(Math.round(p * 100)),
        );
        setOutBlob(blob);
        setPreview(URL.createObjectURL(blob));
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
      form.append('copyright', copyright);
      form.append('nsfw', nsfw ? 'true' : 'false');
      if (lightningAddress) form.append('zap', lightningAddress);

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
      if (lightningAddress) tags.push(['zap', lightningAddress]);
      if (nsfw) tags.push(['nsfw', 'true']);
      if (copyright) tags.push(['copyright', copyright]);

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

  function handleCancel() {
    if (
      (file ||
        outBlob ||
        preview ||
        caption ||
        topics ||
        copyright ||
        nsfw ||
        lightningAddress) &&
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
      <input
        type="text"
        value={copyright}
        onChange={(e) => setCopyright(e.target.value)}
        placeholder="Copyright information"
        className="block w-full text-sm rounded-md border border-border bg-transparent px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      />
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
    <section className="max-w-4xl mx-auto overflow-auto rounded-2xl border border-border bg-white/5 dark:bg-neutral-900 p-6 space-y-4">
      <div className="flex items-center justify-end">
        <button className="text-sm text-muted-foreground" onClick={handleCancel}>
          Cancel
        </button>
      </div>
      <div className="lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0 space-y-4">
        <div className="space-y-4">
          <input
            type="file"
            accept="video/*"
            onChange={onPick}
            className="block w-full text-sm rounded-md border border-border bg-transparent px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          />
            {preview ? (
              <div className="relative aspect-[9/16] w-full max-w-sm max-h-[calc(100vh-8rem)] overflow-hidden rounded-xl bg-black">
                <video
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
              <div className="relative aspect-[9/16] w-full max-w-sm max-h-[calc(100vh-8rem)] overflow-hidden rounded-xl bg-black">
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
