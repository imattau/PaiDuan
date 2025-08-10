"use client";

export const dynamic = 'force-dynamic';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import AppShell from '@/components/layout/AppShell';
import MainNav from '@/components/layout/MainNav';
import { Card } from '@/components/ui/Card';
import * as nip19 from 'nostr-tools/nip19';
import { hexToBytes } from '@noble/hashes/utils';
import { toast } from 'react-hot-toast';

export default function Profile() {
  const { state } = useAuth();
  const router = useRouter();
  const meta = useProfile(state.status === 'ready' ? state.pubkey : undefined);

  const exportKey = async () => {
    if (state.status !== 'ready' || state.method !== 'local') return;
    if (!navigator?.clipboard) {
      console.warn('Clipboard API not available');
      return;
    }
    const priv = (state.signer as any).privkeyHex;
    if (!priv) return;
    const nsec = nip19.nsecEncode(hexToBytes(priv));
    await navigator.clipboard.writeText(nsec);
    toast.success('nsec copied to clipboard');
  };

  const nav = <MainNav showSearch={false} showProfile={false} />;

  if (state.status !== 'ready') {
    return (
      <AppShell
        left={nav}
        center={
          <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
            <Card title="Profile" desc="Sign in to view your profile.">
              <div>Not signed in.</div>
            </Card>
          </div>
        }
      />
    );
  }

  return (
    <AppShell
      left={nav}
      center={
        <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
          <Card title="Profile" desc="Your public profile information.">
            <div className="flex items-center gap-4">
              <Image
                src={meta?.picture || '/avatar.svg'}
                alt="avatar"
                width={96}
                height={96}
                priority
                className="h-24 w-24 rounded-full object-cover"
                onError={(e) => (e.currentTarget.src = '/avatar.svg')}
                crossOrigin="anonymous"
              />
              <div className="text-lg font-semibold">{meta?.name || 'Anonymous'}</div>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <button className="btn btn-outline" onClick={() => router.push('/onboarding/profile')}>
                Edit
              </button>
              {state.method === 'local' && (
                <button className="btn btn-outline" onClick={exportKey}>
                  Export key
                </button>
              )}
            </div>
          </Card>
        </div>
      }
    />
  );
}

