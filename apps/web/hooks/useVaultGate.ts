import { useEffect } from 'react';

export function useVaultGate(nextHrefWhenHasKeys = '/en/feed') {
  useEffect(() => {
    try {
      const vault = localStorage.getItem('nostrVault');
      if (vault) window.location.replace(nextHrefWhenHasKeys);
    } catch {}
  }, [nextHrefWhenHasKeys]);
}
