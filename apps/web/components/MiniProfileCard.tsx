import Link from 'next/link';
import Image from 'next/image';
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
      <Image
        src={profile?.picture || '/avatar.svg'}
        alt="Profile avatar"
        width={80}
        height={80}
        priority
        className="mx-auto mb-2 h-20 w-20 rounded-full"
        onError={(e) => (e.currentTarget.src = '/avatar.svg')}
        crossOrigin="anonymous"
      />
      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">@{name}</div>
      {stats && (
        <div className="mt-1 text-xs text-muted">
          {stats.followers.toLocaleString()} followers • {stats.following.toLocaleString()} following
        </div>
      )}
      <Link
        href="/settings#profile"
        className="text-xs text-accent-primary"
        prefetch
      >
        Manage profile
      </Link>
    </div>
  );
}
