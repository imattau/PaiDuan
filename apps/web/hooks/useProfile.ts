'use client';
import { useProfiles } from './useProfiles';

export function useProfile(pubkey?: string) {
  const profiles = useProfiles(pubkey ? [pubkey] : []);
  return pubkey ? profiles.get(pubkey) ?? null : null;
}
