import React from 'react';
import ZapButton from './ZapButton';

interface ProfileHeaderProps {
  avatarUrl: string;
  name: string;
  lightningAddress: string;
  pubkey: string;
  zapTotal?: number;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ avatarUrl, name, lightningAddress, pubkey, zapTotal }) => {
  return (
    <div className="flex items-center space-x-3 p-4">
      <img src={avatarUrl} alt={name} className="h-12 w-12 rounded-full" />
      <div className="flex-1 font-semibold">{name}</div>
      <ZapButton lightningAddress={lightningAddress} pubkey={pubkey} total={zapTotal} />
    </div>
  );
};

export default ProfileHeader;
