import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import SideNav from '../components/SideNav';
import { Card } from '../components/ui/Card';
import { nip19 } from 'nostr-tools';
import { hexToBytes } from '@noble/hashes/utils';

export default function Profile() {
  const { state } = useAuth();
  const router = useRouter();
  const meta = useProfile(state.status === 'ready' ? state.pubkey : undefined);

  const exportKey = async () => {
    if (state.status !== 'ready' || state.method !== 'local') return;
    const priv = (state.signer as any).privkeyHex;
    if (!priv) return;
    const nsec = nip19.nsecEncode(hexToBytes(priv));
    await navigator.clipboard.writeText(nsec);
    alert('nsec copied to clipboard');
  };

  if (state.status !== 'ready') {
    return (
      <>
        <SideNav />
        <main className="max-w-3xl mx-auto px-4 py-10 space-y-6 lg:ml-48">
          <Card title="Profile" desc="Sign in to view your profile.">
            <div>Not signed in.</div>
          </Card>
        </main>
      </>
    );
  }

  return (
    <>
      <SideNav />
      <main className="max-w-3xl mx-auto px-4 py-10 space-y-6 lg:ml-48">
        <Card title="Profile" desc="Your public profile information.">
          <div className="flex items-center gap-4">
            <img
              src={meta?.picture || '/avatar.svg'}
              alt="avatar"
              className="h-24 w-24 rounded-full object-cover"
            />
            <div className="text-lg font-semibold">{meta?.name || 'Anonymous'}</div>
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <button className="btn-secondary" onClick={() => router.push('/onboarding/profile')}>
              Edit
            </button>
            {state.method === 'local' && (
              <button className="btn-secondary" onClick={exportKey}>
                Export key
              </button>
            )}
          </div>
        </Card>
      </main>
    </>
  );
}

