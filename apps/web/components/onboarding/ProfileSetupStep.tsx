'use client';

import { useCallback, useEffect, useState } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import type { EventTemplate } from 'nostr-tools/pure';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { getPool, getRelays } from '@/lib/nostr';
import { Button } from '@paiduan/ui';

export function ProfileSetupStep({ onComplete }: { onComplete: () => void }) {
  const { state } = useAuth();
  const meta = useProfile(state.status === 'ready' ? state.pubkey : undefined);
  const [name, setName] = useState('');
  const [about, setAbout] = useState('');
  const [picture, setPicture] = useState<string>('');
  const [rawImage, setRawImage] = useState<string>('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!meta) return;
    if (!name) setName(meta.name || '');
    if (!about) setAbout(meta.about || '');
    if (!picture) setPicture(meta.picture || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta]);

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

  function createImage(url: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
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
    ctx.drawImage(
      image,
      croppedArea.x,
      croppedArea.y,
      size,
      size,
      0,
      0,
      size,
      size
    );
    const dataUrl = canvas.toDataURL('image/png');
    setPicture(dataUrl);
    setRawImage('');
  }, [rawImage, croppedArea]);

  async function setMetadata(data: { name?: string; about?: string; picture?: string }) {
    if (state.status !== 'ready') throw new Error('Not signed in');
    const content = JSON.stringify(data);
    const tmpl: EventTemplate = {
      kind: 0,
      created_at: Math.floor(Date.now() / 1000),
      tags: [],
      content
    };
    const signed = await state.signer.signEvent({ ...tmpl });
    const pool = getPool();
    await pool.publish(getRelays(), signed as any);
  }

  async function saveProfile() {
    try {
      setLoading(true);
      await setMetadata({ name, about, picture });
      setLoading(false);
      onComplete();
    } catch (e: any) {
      alert(e.message || 'Failed to save');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl mb-4">Set up your profile</h1>
      <div className="w-full max-w-md space-y-3 flex flex-col items-center text-center">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="w-full rounded border-token border p-2 bg-card text-foreground"
        />
        <textarea
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          placeholder="Bio"
          className="w-full rounded border-token border p-2 bg-card text-foreground"
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
            <Button className="btn-secondary" onClick={finishCrop}>
              Done
            </Button>
          </div>
        )}
        {!rawImage && picture && (
          <div
            className="rounded-lg p-[2px]"
            style={{ background: 'linear-gradient(145deg, #2a2a2a, #1c1c1c)' }}
          >
            <img src={picture} alt="avatar" className="h-20 w-20 rounded-lg object-cover" />
          </div>
        )}
        <Button
          onClick={saveProfile}
          disabled={loading}
          className="btn-primary disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  );
}

export default ProfileSetupStep;
