import React from 'react';
import Image from 'next/image';
import ZapButton from './ZapButton';
import useOffline from '../utils/useOffline';

interface ProfileHeaderProps {
  avatarUrl: string;
  name: string;
  lightningAddress: string;
  pubkey: string;
  zapTotal?: number;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ avatarUrl, name, lightningAddress, pubkey, zapTotal }) => {
  const online = useOffline();
  return (
    <div className="flex items-center space-x-3 p-4">
      <Image
        src={avatarUrl}
        alt={name}
        width={48}
        height={48}
        className="h-12 w-12 rounded-full"
        unoptimized
      />
      <div className="flex-1 font-semibold">{name}</div>
      <ZapButton lightningAddress={lightningAddress} pubkey={pubkey} total={zapTotal} disabled={!online} title={!online ? 'Offline – reconnect to interact.' : undefined} />
    </div>
  );
};

export default ProfileHeader;
