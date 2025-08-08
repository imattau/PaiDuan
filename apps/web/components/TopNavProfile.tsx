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
    <div
      onClick={handleClick}
      className="cursor-pointer rounded-lg p-[2px]"
      style={{ background: 'linear-gradient(145deg, #2a2a2a, #1c1c1c)' }}
    >
      <img
        src={profile?.picture || '/avatar.svg'}
        alt="Profile avatar"
        className="h-20 w-20 rounded-lg"
      />
    </div>
  );
}
