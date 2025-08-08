import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

export default function MiniProfileCard() {
  const { state } = useAuth();
  const profile = useProfile(state.status === 'ready' ? state.pubkey : undefined);
  const name = profile?.name || 'user';

  return (
    <div className="rounded-xl border border-gray-200/60 dark:border-gray-700/60 p-3 text-center">
      <div
        className="mx-auto mb-2 rounded-lg p-[2px]"
        style={{ background: 'linear-gradient(145deg, #2a2a2a, #1c1c1c)' }}
      >
        <img
          src={profile?.picture || '/avatar.svg'}
          alt="Profile avatar"
          className="h-20 w-20 rounded-lg"
        />
      </div>
      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">@{name}</div>
      <Link href="/en/settings#profile" className="text-xs text-[var(--accent)]">
        Manage profile
      </Link>
    </div>
  );
}
