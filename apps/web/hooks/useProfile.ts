'use client';
import { useEffect } from 'react';
import { useProfiles } from './useProfiles';

export function useProfile(pubkey?: string) {
  const profiles = useProfiles(pubkey ? [pubkey] : []);
  const profile = pubkey ? profiles.get(pubkey) ?? null : null;
  useEffect(() => {
    return () => {
      profile?.pictureRevoke?.();
    };
  }, [profile?.pictureRevoke]);
  return profile;
}
