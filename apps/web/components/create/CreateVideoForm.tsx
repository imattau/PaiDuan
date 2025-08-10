'use client';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import PlaceholderVideo from '../PlaceholderVideo';
import { trimVideoWebCodecs } from '../../utils/trimVideoWebCodecs';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { useProfiles } from '../../hooks/useProfiles';
import useFollowing from '../../hooks/useFollowing';
import upload from '../../agents/upload';
import media from '../../agents/media';
import { nostr } from '../../agents/nostr';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-hot-toast';
import { bus } from '../../agents/bus';
import Overlay from '../ui/Overlay';

function confirmModal(
  message: string,
  cancelLabel: string,
  okLabel: string,
): Promise<boolean> {
  return new Promise((resolve) => {
    const handleConfirm = () => {
      Overlay.close();
      resolve(true);
    };
    const handleCancel = () => {
      Overlay.close();
      resolve(false);
    };
    Overlay.open('modal', {
      content: (
        <div className="text-sm">
          <p>{message}</p>
          <div className="mt-4 flex justify-end gap-2">
            <button className="px-3 py-1" onClick={handleCancel}>
              {cancelLabel}
            </button>
            <button
              className="px-3 py-1 bg-accent-primary text-white"
              onClick={handleConfirm}
            >
              {okLabel}
            </button>
          </div>
        </div>
      ),
      onClose: handleCancel,
    });
  });
}

export default function CreateVideoForm() {
  const router = useRouter();
  const t = useTranslations('create');
  const tCommon = useTranslations('common');
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
    lnaddr: z.string().min(1, t('lightning_address_required')),
    pct: z.number().min(1).max(95),
  });
  const schema = z.object({
    caption: z.string().min(1, t('caption_required')),
    topics: z.string().min(1, t('topics_required')),
    license: z.string().min(1, t('license_required')),
    lightningAddress: z.string().min(1, t('lightning_address_required')),
    zapSplits: z
      .array(splitSchema)
      .max(4)
      .refine((arr) => arr.reduce((sum, s) => sum + s.pct, 0) <= 95, {
        message: t('split_total_max'),
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

    useEffect(() => {
      const unsubPublished = bus.on('nostr.published', () =>
        toast.success(t('posted_to_nostr')),
      );
    const unsubNostrError = bus.on('nostr.error', (e) =>
      toast.error(e.error),
    );
    const unsubUploadError = bus.on('upload.error', (e) =>
      toast.error(e.error),
    );
    return () => {
      unsubPublished();
      unsubNostrError();
      unsubUploadError();
    };
    }, [t]);

  const walletAddrs = Array.isArray(profile?.wallets) && profile.wallets.length > 0
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
      const def =
        Array.isArray(profile?.wallets) && profile.wallets.length > 0
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
            video.onerror = () => reject(new Error(t('failed_read_video')));
            video.src = url;
          });

        const width = video.videoWidth;
        const height = video.videoHeight;
        const duration = video.duration;
        setDimensions({ width, height });
        URL.revokeObjectURL(url);
        video.remove();

        const ratio = width / height;
        const targetRatio = 9 / 16;
          if (Math.abs(ratio - targetRatio) > 0.01) {
            setErr(t('video_must_be_916'));
            setFile(null);
            updatePreview(null);
            setProgress(0);
            return;
          }

        let blob: Blob | null = null;
        try {
          blob = await trimVideoWebCodecs(
            f,
            {
              start: 0,
              end: Math.min(300, duration),
            },
            (p) => setProgress(Math.round(p * 100)),
          );
        } catch (err: any) {
          console.error(err);
          const code = (err as any)?.code;
            if (code === 'no-keyframe') {
              setErr(t('cannot_trim_no_keyframe'));
              setProgress(0);
              return;
            }
            if (code === 'demux-failed') {
              setErr(t('failed_read_video'));
              setProgress(0);
              return;
            }
            setErr(err?.message || t('video_processing_failed'));
            setProgress(0);
            return;
          }

          if (!blob) {
            setErr(t('webcodecs_unavailable'));
            return;
          }

        blob = new Blob([blob], { type: f.type });

        setOutBlob(blob);
        updatePreview(URL.createObjectURL(blob));
        } catch (e: any) {
          console.error(e);
          setErr(e?.message || t('conversion_failed'));
          setProgress(0);
        }
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'video/mp4': ['.mp4'], 'video/webm': ['.webm'] },
    onDrop: (accepted) => onPick(accepted[0] ?? null),
  });

  const onSubmit = async (values: FormValues) => {
      if (!outBlob) {
        setErr(t('process_video_first'));
        return;
      }

    try {
      setPosting(true);
      const form = new FormData();
      const ext = file?.type === 'video/mp4' ? '.mp4' : '.webm';
      const mimeTag = file?.type === 'video/mp4' ? 'm video/mp4' : 'm video/webm';
      form.append('file', outBlob, `video${ext}`);
      form.append('caption', values.caption);
      form.append('topics', values.topics);
      const licenseValue = values.license === 'other' ? customLicense : values.license;
      form.append('copyright', licenseValue);
      form.append('nsfw', nsfw ? 'true' : 'false');
      if (values.lightningAddress) form.append('zap', values.lightningAddress);
      if (values.zapSplits.length) form.append('zapSplits', JSON.stringify(values.zapSplits));

      const { video, poster, manifest } = await upload.uploadVideo(form);

      if (state.status !== 'ready') throw new Error('signer required');

      const event = media.createVideoEvent({
        caption: values.caption,
        topics: values.topics,
        license: licenseValue,
        lightningAddress: values.lightningAddress,
        zapSplits: values.zapSplits,
        nsfw,
        dimensions,
        video,
        poster,
        manifest,
        mimeTag,
        pubkey: state.pubkey,
      });

      await nostr.publishEvent(event, state.signer);
    } catch (e) {
      console.error(e);
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

  async function handleCancel() {
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
        !(await confirmModal(t('discard_progress'), t('cancel'), t('ok')))
    )
      return;
    router.back();
  }

  const form = (
    <>
        <input
          type="text"
          {...register('caption')}
          placeholder={t('caption_placeholder')}
          className="block w-full text-sm rounded-md border border-border bg-transparent px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        />
      {errors.caption && (
        <div className="text-sm text-red-500">{errors.caption.message}</div>
      )}
        <input
          type="text"
          {...register('topics')}
          placeholder={t('topics_placeholder')}
          className="block w-full text-sm rounded-md border border-border bg-transparent px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        />
      {errors.topics && (
        <div className="text-sm text-red-500">{errors.topics.message}</div>
      )}
        <label className="block text-sm">
          <span className="mb-1 block">{t('lightning_address')}</span>
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
              <option value="">{t('other_option')}</option>
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
              placeholder={t('lnaddr_placeholder')}
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
              {t('remove')}
            </button>
          </div>
        ))}
      {errors.zapSplits?.message && (
        <div className="text-sm text-red-500">{errors.zapSplits.message as string}</div>
      )}
        {zapFields.length < 4 && totalPct < 95 && (
          <button type="button" onClick={addSplit} className="rounded border px-2 py-1 text-sm">
            {t('add_collaborator')}
          </button>
        )}
        {zapSplits.length > 0 && (
          <div className="text-sm">{t('total_pct', { pct: totalPct })}</div>
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
          <span className="mb-1 block">{tCommon('license')}</span>
          <select
            data-testid="license-select"
            {...register('license')}
            className="block w-full rounded-md border border-border bg-transparent px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            <option value="All Rights Reserved">{tCommon('license_all_rights_reserved')}</option>
            <option value="CC0 (Public Domain)">{tCommon('license_cc0')}</option>
            <option value="CC BY">{tCommon('license_cc_by')}</option>
            <option value="CC BY-SA">{tCommon('license_cc_by_sa')}</option>
            <option value="CC BY-ND">{tCommon('license_cc_by_nd')}</option>
            <option value="CC BY-NC">{tCommon('license_cc_by_nc')}</option>
            <option value="CC BY-NC-SA">{tCommon('license_cc_by_nc_sa')}</option>
            <option value="CC BY-NC-ND">{tCommon('license_cc_by_nc_nd')}</option>
            <option value="other">{tCommon('license_other')}</option>
          </select>
          {license === 'other' && (
            <input
              data-testid="custom-license-input"
              type="text"
              value={customLicense}
              onChange={(e) => setCustomLicense(e.target.value)}
              placeholder={tCommon('license_custom')}
              className="mt-2 block w-full text-sm rounded-md border border-border bg-transparent px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            />
          )}
          {errors.license && (
          <div className="text-sm text-red-500">{errors.license.message}</div>
        )}
      </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={nsfw} onChange={(e) => setNsfw(e.target.checked)} />
          <span className="text-sm">{t('nsfw')}</span>
        </label>
        <button
          className="btn btn-primary disabled:opacity-60"
          data-testid="publish-button"
          disabled={!outBlob || posting || !isValid}
          onClick={handleSubmit(onSubmit)}
        >
          {posting ? t('publishing') : t('publish')}
        </button>
    </>
  );

  return (
    <section className="w-full sm:max-w-4xl mx-auto rounded-2xl border border-border bg-white/5 dark:bg-neutral-900 p-6 space-y-4">
        <div className="flex items-center justify-end">
          <button className="text-sm text-muted" onClick={handleCancel}>
            {t('cancel')}
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
              <PlaceholderVideo
                className="absolute inset-0 h-full w-full object-cover"
                message={t('no_video_selected')}
                busy={false}
              />
            )}
            {isDragActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                {t('drop_file_here')}
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
