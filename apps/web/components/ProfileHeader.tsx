import React from 'react';
import Image from 'next/image';
import ZapButton from './ZapButton';
import { useNetworkState } from 'react-use';

interface ProfileHeaderProps {
  avatarUrl: string;
  name: string;
  lightningAddress: string;
  pubkey: string;
  zapTotal?: number;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ avatarUrl, name, lightningAddress, pubkey, zapTotal }) => {
  const { online } = useNetworkState();
  return (
    <div className="flex flex-col items-center space-y-3 p-4 text-center">
      <div className="rounded-lg bg-surface p-[2px]">
        <Image
          src={avatarUrl}
          alt={name}
          width={80}
          height={80}
          className="h-20 w-20 rounded-lg"
          unoptimized
          onError={(e) => (e.currentTarget.src = '/avatar.svg')}
          crossOrigin="anonymous"
        />
      </div>
      <div className="font-semibold">{name}</div>
      <ZapButton
        lightningAddress={lightningAddress}
        pubkey={pubkey}
        total={zapTotal}
        disabled={!online}
        title={!online ? 'Offline – reconnect to interact.' : undefined}
      />
    </div>
  );
};

export default ProfileHeader;
