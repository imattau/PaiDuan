import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { cardStyle } from '@/components/ui/Card';

export default function MiniProfileCard({
  stats,
}: {
  stats?: { followers: number; following: number };
}) {
  const { state } = useAuth();
  const profile = useProfile(state.status === 'ready' ? state.pubkey : undefined);
  const name = profile?.name || 'user';

  return (
    <div className={`${cardStyle} p-3 text-center`}>
      <img
        src={profile?.picture || '/avatar.svg'}
        alt="Profile avatar"
        className="mx-auto mb-2 h-20 w-20 rounded-full"
      />
      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">@{name}</div>
      {stats && (
        <div className="mt-1 text-xs text-muted-foreground">
          {stats.followers.toLocaleString()} followers • {stats.following.toLocaleString()} following
        </div>
      )}
      <Link href="/en/settings#profile" className="text-xs text-[var(--accent)]">
        Manage profile
      </Link>
    </div>
  );
}
