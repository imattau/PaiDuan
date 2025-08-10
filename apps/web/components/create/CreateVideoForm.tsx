'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-hot-toast';
import upload from '../../agents/upload';
import media from '../../agents/media';
import { nostr } from '../../agents/nostr';
import { bus } from '../../agents/bus';
import Overlay from '../ui/Overlay';
import VideoPreview from './VideoPreview';
import MetadataForm from './MetadataForm';
import { useVideoProcessing } from '../../hooks/useVideoProcessing';
import { useZapSplits } from '../../hooks/useZapSplits';
import { useAuth } from '../../hooks/useAuth';

function confirmModal(message: string, cancelLabel: string, okLabel: string): Promise<boolean> {
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
            <button className="px-3 py-1 bg-accent-primary text-white" onClick={handleConfirm}>
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
  const [customLicense, setCustomLicense] = useState('');
  const [nsfw, setNsfw] = useState(false);
  const [posting, setPosting] = useState(false);
  const { state } = useAuth();

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

  const video = useVideoProcessing(t);
  const zap = useZapSplits(control, watch, setValue);

  useEffect(() => {
    const unsubPublished = bus.on('nostr.published', () => toast.success(t('posted_to_nostr')));
    const unsubNostrError = bus.on('nostr.error', (e) => toast.error(e.error));
    const unsubUploadError = bus.on('upload.error', (e) => toast.error(e.error));
    return () => {
      unsubPublished();
      unsubNostrError();
      unsubUploadError();
    };
  }, [t]);

  const caption = watch('caption');
  const topics = watch('topics');
  const lightningAddress = watch('lightningAddress');
  const zapSplits = watch('zapSplits');
  const license = watch('license');

  const onSubmit = async (values: FormValues) => {
    if (!video.outBlob) {
      video.setErr(t('process_video_first'));
      return;
    }
    try {
      setPosting(true);
      const form = new FormData();
      const ext = video.file?.type === 'video/mp4' ? '.mp4' : '.webm';
      const mimeTag = video.file?.type === 'video/mp4' ? 'm video/mp4' : 'm video/webm';
      form.append('file', video.outBlob, `video${ext}`);
      form.append('caption', values.caption);
      form.append('topics', values.topics);
      const licenseValue = values.license === 'other' ? customLicense : values.license;
      form.append('copyright', licenseValue);
      form.append('nsfw', nsfw ? 'true' : 'false');
      if (values.lightningAddress) form.append('zap', values.lightningAddress);
      if (values.zapSplits.length) form.append('zapSplits', JSON.stringify(values.zapSplits));
      const { video: v, poster, manifest } = await upload.uploadVideo(form);
      if (state.status !== 'ready') throw new Error('signer required');
      const event = media.createVideoEvent({
        caption: values.caption,
        topics: values.topics,
        license: licenseValue,
        lightningAddress: values.lightningAddress,
        zapSplits: values.zapSplits,
        nsfw,
        dimensions: video.dimensions,
        video: v,
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

  async function handleCancel() {
    if (
      (video.file ||
        video.outBlob ||
        video.preview ||
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

  return (
    <section className="w-full sm:max-w-4xl mx-auto rounded-2xl border border-border bg-white/5 dark:bg-neutral-900 p-6 space-y-4">
      <div className="flex items-center justify-end">
        <button className="text-sm text-muted" onClick={handleCancel}>
          {t('cancel')}
        </button>
      </div>
      <div className="flex flex-1 flex-wrap gap-4 items-start">
        <div className="w-full sm:max-w-sm">
          <VideoPreview
            preview={video.preview}
            err={video.err}
            progress={video.progress}
            getRootProps={video.getRootProps}
            getInputProps={video.getInputProps}
            isDragActive={video.isDragActive}
            videoRef={video.videoRef}
            noVideoMessage={t('no_video_selected')}
            dropMessage={t('drop_file_here')}
          />
        </div>
        <div className="space-y-4">
          <MetadataForm
            register={register}
            errors={errors}
            license={license}
            customLicense={customLicense}
            setCustomLicense={setCustomLicense}
            nsfw={nsfw}
            setNsfw={setNsfw}
            showZapSelect={zap.showZapSelect}
            zapOptions={zap.zapOptions}
            selectedZapOption={zap.selectedZapOption}
            setLightningAddress={(v) => setValue('lightningAddress', v)}
            zapFields={zap.zapFields}
            addSplit={zap.addSplit}
            removeSplit={zap.removeSplit}
            totalPct={zap.totalPct}
            lnaddrOptions={zap.lnaddrOptions}
            errorsZapSplits={errors.zapSplits?.message as string | undefined}
            t={t}
            tCommon={tCommon}
            outBlob={video.outBlob}
            posting={posting}
            isValid={isValid}
            handleSubmit={handleSubmit}
            onSubmit={onSubmit}
          />
        </div>
      </div>
    </section>
  );
}
