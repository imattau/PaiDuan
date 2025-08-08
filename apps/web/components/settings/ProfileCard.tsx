import React, { useEffect, useState } from 'react';
import type { EventTemplate } from 'nostr-tools/pure';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { getPool, getRelays } from '@/lib/nostr';
import { Card } from '../ui/Card';

export function ProfileCard() {
  const { state } = useAuth();
  const meta = useProfile(state.status === 'ready' ? state.pubkey : undefined);
  const [name, setName] = useState('');
  const [about, setAbout] = useState('');
  const [picture, setPicture] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!meta) return;
    setName(meta.name || '');
    setAbout(meta.about || '');
    setPicture(meta.picture || '');
  }, [meta]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPicture(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function save() {
    if (state.status !== 'ready') return;
    try {
      setSaving(true);
      const content = JSON.stringify({ ...(meta || {}), name, about, picture });
      const tmpl: EventTemplate = {
        kind: 0,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content,
      };
      const signed = await state.signer.signEvent({ ...tmpl });
      const pool = getPool();
      await pool.publish(getRelays(), signed as any);
      setSaving(false);
    } catch (e: any) {
      alert(e.message || 'Failed to save');
      setSaving(false);
    }
  }

  return (
    <div id="profile">
      <Card title="Profile" desc="Update your public profile.">
        <div className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="w-full rounded bg-foreground/10 p-2 text-sm outline-none"
          />
          <textarea
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            placeholder="Bio"
            className="w-full rounded bg-foreground/10 p-2 text-sm outline-none"
          />
          <input type="file" accept="image/*" onChange={handleFile} />
          {picture && (
            <img src={picture} alt="avatar" className="h-20 w-20 rounded-full object-cover" />
          )}
          <button
            type="button"
            onClick={save}
            className="btn btn-secondary"
            disabled={saving || state.status !== 'ready'}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </Card>
    </div>
  );
}

export default ProfileCard;

