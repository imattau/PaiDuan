'use client';

import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import NextImage from 'next/image';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import type { EventTemplate } from 'nostr-tools/pure';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { getRelays } from '@/lib/nostr';
import pool from '@/lib/relayPool';
import { Button } from '@paiduan/ui';

export function ProfileSetupStep({ onComplete }: { onComplete: () => void }) {
  const { state } = useAuth();
  const meta = useProfile(state.status === 'ready' ? state.pubkey : undefined);
  const schema = z.object({
    name: z.string().min(1, 'Name is required'),
    about: z.string().optional(),
    picture: z.string().optional(),
    lud16: z.string().optional(),
  });
  type FormValues = z.infer<typeof schema>;
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { name: '', about: '', picture: '', lud16: '' },
  });
  const name = watch('name');
  const about = watch('about');
  const picture = watch('picture');
  const lud16 = watch('lud16');
  const [rawImage, setRawImage] = useState<string>('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!meta) return;
    setValue('name', meta.name || '');
    setValue('about', meta.about || '');
    setValue('picture', meta.picture || '');
    setValue('lud16', meta.lud16 || '');
  }, [meta, setValue]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setRawImage(reader.result as string);
    reader.readAsDataURL(file);
  }

  const onCropComplete = useCallback((_area: Area, cropped: Area) => {
    setCroppedArea(cropped);
  }, []);

  function createImage(url: string): Promise<HTMLImageElement> {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = document.createElement('img');
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = url;
    });
  }

  const finishCrop = useCallback(async () => {
    if (!rawImage || !croppedArea) return;
    const image = await createImage(rawImage);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const size = Math.min(croppedArea.width, croppedArea.height);
    canvas.width = size;
    canvas.height = size;
    ctx.drawImage(image, croppedArea.x, croppedArea.y, size, size, 0, 0, size, size);
    const dataUrl = canvas.toDataURL('image/png');
    setValue('picture', dataUrl);
    setRawImage('');
  }, [rawImage, croppedArea, setValue]);

  async function setMetadata(data: {
    name?: string;
    about?: string;
    picture?: string;
    lud16?: string;
  }) {
    if (state.status !== 'ready') throw new Error('Not signed in');
    const content = JSON.stringify(data);
    const tmpl: EventTemplate = {
      kind: 0,
      created_at: Math.floor(Date.now() / 1000),
      tags: [],
      content,
    };
    const signed = await state.signer.signEvent({ ...tmpl });
    await pool.publish(getRelays(), signed as any);
  }

  const onSubmit = async (data: FormValues) => {
    try {
      setLoading(true);
      await setMetadata(data);
      setLoading(false);
      onComplete();
    } catch (e: any) {
      alert(e.message || 'Failed to save');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-primary flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl mb-4">Set up your profile</h1>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-md space-y-3 flex flex-col items-center text-center"
      >
        <input
          {...register('name')}
          placeholder="Name"
          className="w-full rounded border-border-primary border p-2 bg-card text-primary"
        />
        {errors.name && <span className="text-sm text-red-500">{errors.name.message}</span>}
        <textarea
          {...register('about')}
          placeholder="Bio"
          className="w-full rounded border-border-primary border p-2 bg-card text-primary"
        />
        <input
          {...register('lud16')}
          placeholder="Lightning Address"
          className="w-full rounded border-border-primary border p-2 bg-card text-primary"
        />
        <input type="file" accept="image/*" onChange={handleFile} />
        {rawImage && (
          <div className="relative h-64 w-64">
            <Cropper
              image={rawImage}
              crop={crop}
              zoom={zoom}
              cropShape="round"
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              showGrid={false}
            />
          </div>
        )}
        {rawImage && (
          <div className="flex gap-2 justify-center">
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
            />
            <Button className="btn-outline" onClick={finishCrop}>
              Done
            </Button>
          </div>
        )}
        {!rawImage && picture && (
          <div
            className="rounded-lg p-[2px]"
            style={{ background: 'linear-gradient(145deg, #2a2a2a, #1c1c1c)' }}
          >
            <NextImage
              src={picture}
              alt="avatar"
              width={80}
              height={80}
              className="h-20 w-20 rounded-lg object-cover"
              onError={(e) => (e.currentTarget.src = '/avatar.svg')}
              crossOrigin="anonymous"
            />
          </div>
        )}
        <Button
          type="submit"
          disabled={loading || !isValid}
          className="btn-primary disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Save'}
        </Button>
      </form>
    </div>
  );
}

export default ProfileSetupStep;
