import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import type { EventTemplate } from 'nostr-tools/pure';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { getRelays } from '@/lib/nostr';
import pool from '@/lib/relayPool';
import { Card } from '../ui/Card';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

export function ProfileCard() {
  const { state } = useAuth();
  const meta = useProfile(state.status === 'ready' ? state.pubkey : undefined);
  const schema = z.object({
    name: z.string().min(1, 'Name is required'),
    about: z.string().optional(),
    picture: z.string().optional(),
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
    defaultValues: { name: '', about: '', picture: '' },
  });
  const picture = watch('picture');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!meta) return;
    setValue('name', meta.name || '');
    setValue('about', meta.about || '');
    setValue('picture', meta.picture || '');
  }, [meta, setValue]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setValue('picture', reader.result as string);
    reader.readAsDataURL(file);
  }

  const onSubmit = async (data: FormValues) => {
    if (state.status !== 'ready') return;
    try {
      setSaving(true);
      const content = JSON.stringify({ ...(meta || {}), ...data });
      const tmpl: EventTemplate = {
        kind: 0,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content,
      };
      const signed = await state.signer.signEvent({ ...tmpl });
      await pool.publish(getRelays(), signed as any);
      setSaving(false);
    } catch (e: any) {
      alert(e.message || 'Failed to save');
      setSaving(false);
    }
  };

  return (
    <div id="profile">
      <Card title="Profile" desc="Update your public profile.">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <input
            type="text"
            {...register('name')}
            placeholder="Name"
            className="w-full rounded bg-text-primary/10 p-2 text-sm outline-none"
          />
          {errors.name && <div className="text-sm text-red-500">{errors.name.message}</div>}
          <textarea
            {...register('about')}
            placeholder="Bio"
            className="w-full rounded bg-text-primary/10 p-2 text-sm outline-none"
          />
          <input type="file" accept="image/*" onChange={handleFile} />
          {picture && (
            <Image
              src={picture}
              alt="avatar"
              width={80}
              height={80}
              className="h-20 w-20 rounded-full object-cover"
              onError={(e) => (e.currentTarget.src = '/avatar.svg')}
              crossOrigin="anonymous"
            />
          )}
          <button
            type="submit"
            className="btn btn-outline"
            disabled={saving || state.status !== 'ready' || !isValid}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </form>
      </Card>
    </div>
  );
}

export default ProfileCard;

