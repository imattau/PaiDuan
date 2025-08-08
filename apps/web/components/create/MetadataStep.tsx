'use client';
import { useEffect, useState } from 'react';
import { SimplePool } from 'nostr-tools/pool';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { getRelays } from '@/lib/nostr';

export interface MetadataStepProps {
  blob: Blob;
  preview?: string;
  onBack: () => void;
  onCancel: () => void;
}

export function MetadataStep({ blob, preview, onBack, onCancel }: MetadataStepProps) {
  const [caption, setCaption] = useState('');
  const [topics, setTopics] = useState('');
  const [copyright, setCopyright] = useState('');
  const [nsfw, setNsfw] = useState(false);
  const [lightningAddress, setLightningAddress] = useState('');
  const [busy, setBusy] = useState(false);

  const { state } = useAuth();
  const profile = useProfile(state.status === 'ready' ? state.pubkey : undefined);

  const zapOptions = Array.from(
    new Set([
      ...(profile?.lud16 ? [profile.lud16] : []),
      ...(Array.isArray(profile?.zapSplits)
        ? profile.zapSplits.map((s: any) => s?.lnaddr).filter(Boolean)
        : []),
    ]),
  );
  const showZapSelect =
    (profile?.zapSplits && profile.zapSplits.length > 0) || zapOptions.length > 1;
  const selectedZapOption = zapOptions.includes(lightningAddress) ? lightningAddress : '';

  useEffect(() => {
    if (!lightningAddress && profile?.lud16) setLightningAddress(profile.lud16);
  }, [profile, lightningAddress]);

  async function postVideo() {
    const topicList = topics
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (!lightningAddress.trim()) {
      alert('Lightning address is required');
      return;
    }
    if (topicList.length === 0) {
      alert('At least one topic is required');
      return;
    }

    try {
      setBusy(true);
      const form = new FormData();
      form.append('file', blob, 'video.webm');
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
      setBusy(false);
    }
  }

  function handleCancel() {
    if (
      (caption || topics || copyright || nsfw || lightningAddress) &&
      !confirm('Discard your progress?')
    )
      return;
    onCancel();
  }

  return (
    <section className="max-w-4xl mx-auto rounded-2xl border bg-white/5 dark:bg-neutral-900 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary" onClick={onBack}>
            ← Back
          </button>
          <h2 className="text-lg font-semibold">Metadata</h2>
        </div>
        <button className="text-sm text-muted-foreground" onClick={handleCancel}>
          Cancel
        </button>
      </div>
      <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
        {preview && (
          <video
            controls
            src={preview}
            className="rounded-xl w-full aspect-[9/16] object-cover bg-black lg:col-span-1"
          />
        )}
        <div className="space-y-4 col-span-2 lg:col-span-1">
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Caption"
            className="block w-full text-sm border rounded px-3 py-2 bg-transparent"
          />
          <input
            type="text"
            value={topics}
            onChange={(e) => setTopics(e.target.value)}
            placeholder="Topic tags (comma separated)"
            className="block w-full text-sm border rounded px-3 py-2 bg-transparent"
          />
          <label className="block text-sm">
            <span className="mb-1 block">Lightning address</span>
            {showZapSelect && (
              <select
                value={selectedZapOption}
                onChange={(e) => setLightningAddress(e.target.value)}
                className="block w-full border rounded px-3 py-2 bg-transparent mb-2"
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
              className="block w-full border rounded px-3 py-2 bg-transparent"
            />
          </label>
          <input
            type="text"
            value={copyright}
            onChange={(e) => setCopyright(e.target.value)}
            placeholder="Copyright information"
            className="block w-full text-sm border rounded px-3 py-2 bg-transparent"
          />
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={nsfw} onChange={(e) => setNsfw(e.target.checked)} />
            <span className="text-sm">NSFW</span>
          </label>
          <button className="btn btn-primary disabled:opacity-60" disabled={busy} onClick={postVideo}>
            {busy ? 'Posting…' : 'Post Video'}
          </button>
        </div>
      </div>
    </section>
  );
}

export default MetadataStep;
