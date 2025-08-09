'use client';
import { useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import PlaceholderVideo from '../PlaceholderVideo';
import { trimVideoWebCodecs } from '../../utils/trimVideoWebCodecs';
import { trimVideoFfmpeg, terminateFfmpegPool } from '../../utils/trimVideoFfmpeg';
import { sniffCodec } from '../../utils/codec';
import { canDecode } from '../../utils/canDecode';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { useProfiles } from '../../hooks/useProfiles';
import useFollowing from '../../hooks/useFollowing';
import { getRelays } from '../../lib/nostr';
import pool from '../../lib/relayPool';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

export default function CreateVideoForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [outBlob, setOutBlob] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  const videoRef = useRef<HTMLVideoElement>(null);

  const updatePreview = (url: string | null) => {
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  };

  const [customLicense, setCustomLicense] = useState('');
  const [nsfw, setNsfw] = useState(false);
  const [posting, setPosting] = useState(false);

  const splitSchema = z.object({
    lnaddr: z.string().min(1, 'Lightning address required'),
    pct: z.number().min(1).max(95),
  });
  const schema = z.object({
    caption: z.string().min(1, 'Caption is required'),
    topics: z.string().min(1, 'At least one topic'),
    license: z.string().min(1, 'License is required'),
    lightningAddress: z.string().min(1, 'Lightning address is required'),
    zapSplits: z
      .array(splitSchema)
      .max(4)
      .refine((arr) => arr.reduce((sum, s) => sum + s.pct, 0) <= 95, {
        message: 'Total split percentage must be 95% or less',
        path: ['zapSplits'],
      }),
  });
  type FormValues = z.infer<typeof schema>;
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      caption: '',
      topics: '',
      license: 'All Rights Reserved',
      lightningAddress: '',
      zapSplits: [],
    },
  });
  const { fields: zapFields, append, remove } = useFieldArray({
    control,
    name: 'zapSplits',
  });

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
  const caption = watch('caption');
  const topics = watch('topics');
  const lightningAddress = watch('lightningAddress');
  const zapSplits = watch('zapSplits');
  const license = watch('license');
  const selectedZapOption = zapOptions.includes(lightningAddress) ? lightningAddress : '';
  const totalPct = zapSplits.reduce((sum, s) => sum + (s.pct || 0), 0);

  useEffect(() => {
    if (!lightningAddress) {
      const def = Array.isArray(profile?.wallets)
        ? profile.wallets.find((w: any) => w?.default)?.lnaddr
        : profile?.lud16;
      if (def) setValue('lightningAddress', def);
    }
  }, [profile, lightningAddress, setValue]);

  useEffect(() => {
    if (Array.isArray(profile?.zapSplits)) {
      setValue(
        'zapSplits',
        profile.zapSplits
          .filter((s: any) => typeof s.lnaddr === 'string' && typeof s.pct === 'number')
          .slice(0, 4),
      );
    }
  }, [profile, setValue]);

  useEffect(() => {
    if (videoRef.current && preview) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  useEffect(() => {
    return () => {
      terminateFfmpegPool();
    };
  }, []);

  async function onPick(f: File | null) {
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

        const width = video.videoWidth;
        const height = video.videoHeight;
        setDimensions({ width, height });
        URL.revokeObjectURL(url);
        video.remove();

        const codec = await sniffCodec(f);
        const supported = codec && codec !== 'hvc1' ? await canDecode(codec) : false;
        if (!supported) {
          setErr(
            codec === 'hvc1'
              ? 'HEVC/H.265 detected; converting with FFmpeg.'
              : 'Unsupported codec; converting with FFmpeg.',
          );
          try {
            const blob = await trimVideoFfmpeg(f, {
              start: 0,
              width,
              height,
              onProgress: (p) => setProgress(Math.round(p * 100)),
            });
            setErr(null);
            setOutBlob(blob);
            updatePreview(URL.createObjectURL(blob));
          } catch (err: any) {
            console.error(err);
            setErr(err?.message || 'Conversion failed.');
            setProgress(0);
          }
          return;
        }

        const ffmpegFallback = async (clearErr = false) => {
          try {
            const blob = await trimVideoFfmpeg(f, {
              start: 0,
              width,
              height,
              onProgress: (p) => setProgress(Math.round(p * 100)),
            });
            if (clearErr) setErr(null);
            setOutBlob(blob);
            updatePreview(URL.createObjectURL(blob));
          } catch (err: any) {
            console.error(err);
            setErr(err?.message || 'Conversion failed.');
            setProgress(0);
          }
        };

        let blob: Blob | null = null;
        try {
          blob = await trimVideoWebCodecs(
            f,
            {
              start: 0,
              width,
              height,
            },
            (p) => setProgress(Math.round(p * 100)),
          );
        } catch (err: any) {
          console.error(err);
          const code = (err as any)?.code;
          if (code === 'unsupported-codec') {
            setErr('Unsupported video codec. Converting with FFmpeg.');
            setProgress(0);
            await ffmpegFallback(true);
            return;
          }
          if (code === 'no-keyframe') {
            setErr('Cannot trim this video because it lacks a key frame.');
            setProgress(0);
            return;
          }
          if (code === 'demux-failed') {
            setErr('Failed to read video file.');
            setProgress(0);
            return;
          }
          setErr(err?.message || 'Video processing failed. Relax Shields or try again.');
          setProgress(0);
          await ffmpegFallback();
          return;
        }

        if (!blob) {
          setErr('WebCodecs unavailable. Using slower FFmpeg conversion.');
          await ffmpegFallback();
          return;
        }

        setOutBlob(blob);
        updatePreview(URL.createObjectURL(blob));
      } catch (e: any) {
        console.error(e);
        setErr(e?.message || 'Conversion failed.');
        setProgress(0);
      }
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'video/*': ['.mp4', '.webm', '.mov', '.ogg'] },
    onDrop: (accepted) => onPick(accepted[0] ?? null),
  });

  const onSubmit = async (values: FormValues) => {
    if (!outBlob) {
      alert('Please process a video first');
      return;
    }

    try {
      setPosting(true);
      const form = new FormData();
      form.append('file', outBlob, 'video.webm');
      form.append('caption', values.caption);
      form.append('topics', values.topics);
      const licenseValue = values.license === 'other' ? customLicense : values.license;
      form.append('copyright', licenseValue);
      form.append('nsfw', nsfw ? 'true' : 'false');
      if (values.lightningAddress) form.append('zap', values.lightningAddress);
      if (values.zapSplits.length) form.append('zapSplits', JSON.stringify(values.zapSplits));

      const res = await fetch('https://nostr.media/api/upload', {
        method: 'POST',
        body: form,
      });
      if (!res.ok) throw new Error('Upload failed');
      const { video, poster, manifest } = await res.json();

      const topicList = values.topics
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const totalPctSubmit = values.zapSplits.reduce((sum, s) => sum + s.pct, 0);
      const dim = `${dimensions.width}x${dimensions.height}`;
      const tags: string[][] = [
        ['title', values.caption],
        ['published_at', Math.floor(Date.now() / 1000).toString()],
        ['imeta', `dim ${dim}`, `url ${video}`, 'm video/mp4', `image ${poster}`],
        ...topicList.map((t) => ['t', t]),
      ];
      if (manifest) {
        tags.push([
          'imeta',
          `dim ${dim}`,
          `url ${manifest}`,
          'm application/x-mpegURL',
          `image ${poster}`,
        ]);
      }
      const creatorPct = Math.max(0, 100 - totalPctSubmit);
      if (values.lightningAddress)
        tags.push(['zap', values.lightningAddress, creatorPct.toString()]);
      values.zapSplits.forEach((s) => {
        if (s.lnaddr && s.pct > 0) tags.push(['zap', s.lnaddr, s.pct.toString()]);
      });
      if (nsfw) tags.push(['content-warning', 'nsfw']);
      if (licenseValue) tags.push(['copyright', licenseValue]);

      if (state.status !== 'ready') throw new Error('signer required');
      const kind = dimensions.width >= dimensions.height ? 21 : 22;
      const event: any = {
        kind,
        created_at: Math.floor(Date.now() / 1000),
        content: values.caption,
        tags,
        pubkey: state.pubkey,
      };

      const signed = await state.signer.signEvent(event);
      await pool.publish(getRelays(), signed);
      alert('Posted to Nostr');
    } catch (e: any) {
      alert(e.message || 'Failed to post');
    } finally {
      setPosting(false);
    }
  };

  const addSplit = () => {
    if (zapFields.length >= 4 || totalPct >= 95) return;
    append({ lnaddr: '', pct: 0 });
  };

  const removeSplit = (idx: number) => {
    remove(idx);
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
        {...register('caption')}
        placeholder="Caption"
        className="block w-full text-sm rounded-md border border-border bg-transparent px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      />
      {errors.caption && (
        <div className="text-sm text-red-500">{errors.caption.message}</div>
      )}
      <input
        type="text"
        {...register('topics')}
        placeholder="Topic tags (comma separated)"
        className="block w-full text-sm rounded-md border border-border bg-transparent px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      />
      {errors.topics && (
        <div className="text-sm text-red-500">{errors.topics.message}</div>
      )}
      <label className="block text-sm">
        <span className="mb-1 block">Lightning address</span>
        {showZapSelect && (
          <select
            value={selectedZapOption}
            onChange={(e) => setValue('lightningAddress', e.target.value)}
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
          {...register('lightningAddress')}
          className="block w-full rounded-md border border-border bg-transparent px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        />
        {errors.lightningAddress && (
          <div className="text-sm text-red-500">{errors.lightningAddress.message}</div>
        )}
      </label>
      {zapFields.map((field, i) => (
        <div key={field.id} className="flex items-center gap-2">
          <input
            list="lnaddr-options"
            {...register(`zapSplits.${i}.lnaddr` as const)}
            placeholder="ln@addr"
            className="flex-1 text-sm rounded-md border border-border bg-transparent px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          />
          <input
            type="number"
            min={0}
            max={95}
            {...register(`zapSplits.${i}.pct` as const, { valueAsNumber: true })}
            className="w-20 text-sm rounded-md border border-border bg-transparent px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          />
          <button type="button" className="text-xs underline" onClick={() => removeSplit(i)}>
            remove
          </button>
        </div>
      ))}
      {errors.zapSplits?.message && (
        <div className="text-sm text-red-500">{errors.zapSplits.message as string}</div>
      )}
      {zapFields.length < 4 && totalPct < 95 && (
        <button type="button" onClick={addSplit} className="rounded border px-2 py-1 text-sm">
          Add collaborator
        </button>
      )}
      {zapSplits.length > 0 && <div className="text-sm">Total {totalPct}% / 95%</div>}
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
          {...register('license')}
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
        {errors.license && (
          <div className="text-sm text-red-500">{errors.license.message}</div>
        )}
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={nsfw} onChange={(e) => setNsfw(e.target.checked)} />
        <span className="text-sm">NSFW</span>
      </label>
      <button
        className="btn btn-primary disabled:opacity-60"
        data-testid="publish-button"
        disabled={!outBlob || posting || !isValid}
        onClick={handleSubmit(onSubmit)}
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
          <div
            {...getRootProps({
              className:
                'relative aspect-[9/16] max-h-[70vh] w-full sm:max-w-sm overflow-hidden rounded-xl',
            })}
          >
            <input {...getInputProps()} />
            {preview ? (
              <video
                ref={videoRef}
                controls
                src={preview}
                className="absolute inset-0 h-full w-full object-cover pointer-events-none"
              />
            ) : (
              <PlaceholderVideo className="absolute inset-0 h-full w-full object-cover" />
            )}
            {isDragActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                Drop the file here
              </div>
            )}
            {progress > 0 && progress < 100 && (
              <div
                className="absolute left-0 bottom-0 h-1 bg-blue-500"
                style={{ width: `${progress}%` }}
              />
            )}
          </div>
          {err && <p className="text-sm text-red-500">{err}</p>}
        </div>
        <div className="space-y-4">{form}</div>
      </div>
    </section>
  );
}
