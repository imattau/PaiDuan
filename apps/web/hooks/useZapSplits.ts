import { useEffect, useMemo } from 'react';
import { useFieldArray, Control, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';
import useFollowing from './useFollowing';
import { useProfiles } from './useProfiles';

interface Split {
  lnaddr: string;
  pct: number;
}
interface FormValues {
  lightningAddress: string;
  zapSplits: Split[];
}

export function useZapSplits(
  control: Control<FormValues>,
  watch: UseFormWatch<FormValues>,
  setValue: UseFormSetValue<FormValues>,
) {
  const { state } = useAuth();
  const profile = useProfile(state.status === 'ready' ? state.pubkey : undefined);
  const { following } = useFollowing(state.status === 'ready' ? state.pubkey : undefined);
  const profiles = useProfiles(following);

  useEffect(() => {
    return () => {
      profiles.forEach((p) => p.pictureRevoke?.());
    };
  }, [profiles]);

  const { fields, append, remove } = useFieldArray({ control, name: 'zapSplits' });

  const walletAddrs = Array.isArray(profile?.wallets) && profile.wallets.length > 0
    ? [
        ...profile.wallets.filter((w: any) => w?.default).map((w: any) => w.lnaddr),
        ...profile.wallets.filter((w: any) => !w?.default).map((w: any) => w.lnaddr),
      ]
    : profile?.lud16
      ? [profile.lud16]
      : [];

  const zapOptions = Array.from(
    new Set([
      ...walletAddrs,
      ...(Array.isArray(profile?.zapSplits)
        ? profile.zapSplits.map((s: any) => s?.lnaddr).filter(Boolean)
        : []),
    ]),
  );
  const lightningAddress = watch('lightningAddress');
  const zapSplits = watch('zapSplits') || [];
  const selectedZapOption = zapOptions.includes(lightningAddress) ? lightningAddress : '';
  const showZapSelect =
    (profile?.zapSplits && profile.zapSplits.length > 0) || zapOptions.length > 1;
  const totalPct = zapSplits.reduce((sum: number, s: any) => sum + (s.pct || 0), 0);

  useEffect(() => {
    if (!lightningAddress) {
      const def =
        Array.isArray(profile?.wallets) && profile.wallets.length > 0
          ? profile.wallets.find((w: any) => w?.default)?.lnaddr
          : profile?.lud16;
      if (def) setValue('lightningAddress', def);
    }
  }, [profile, lightningAddress, setValue]);

  useEffect(() => {
    if (Array.isArray(profile?.zapSplits)) {
      setValue(
        'zapSplits',
        profile.zapSplits
          .filter((s: any) => typeof s.lnaddr === 'string' && typeof s.pct === 'number')
          .slice(0, 4),
      );
    }
  }, [profile, setValue]);

  const lnaddrOptions = useMemo(() => {
    return following
      .map((pk) => {
        const p = profiles.get(pk);
        return Array.isArray(p?.wallets)
          ? p.wallets.find((w: any) => w?.default)?.lnaddr
          : p?.lud16;
      })
      .filter((addr): addr is string => !!addr);
  }, [following, profiles]);

  const addSplit = () => {
    if (fields.length >= 4 || totalPct >= 95) return;
    append({ lnaddr: '', pct: 0 });
  };

  const removeSplit = (idx: number) => remove(idx);

  return {
    zapFields: fields,
    addSplit,
    removeSplit,
    totalPct,
    zapOptions,
    showZapSelect,
    selectedZapOption,
    lnaddrOptions,
  };
}
