import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
      <Image
        src={profile?.picture || '/avatar.svg'}
        alt="Profile avatar"
        width={80}
        height={80}
        priority
        className="h-20 w-20 rounded-lg"
        onError={(e) => (e.currentTarget.src = '/avatar.svg')}
        crossOrigin="anonymous"
      />
    </div>
  );
}
