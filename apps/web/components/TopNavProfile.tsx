import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

export default function TopNavProfile() {
  const router = useRouter();
  const { state } = useAuth();
  const profile = useProfile(state.status === 'ready' ? state.pubkey : undefined);

  if (state.status !== 'ready') {
    return null;
  }

  const handleClick = () => {
    router.push(`/p/${state.pubkey}`);
  };

  return (
    <img
      src={profile?.picture || '/avatar.svg'}
      alt="Profile avatar"
      className="h-8 w-8 rounded-full cursor-pointer"
      onClick={handleClick}
    />
  );
}
