"use client";

import { useEffect } from 'react';

const LS_KEY = 'pd.auth.v1';

export function useVaultGate(nextHrefWhenHasKeys = '/en/feed') {
  useEffect(() => {
    try {
      const auth = localStorage.getItem(LS_KEY);
      if (auth) window.location.replace(nextHrefWhenHasKeys);
    } catch {}
  }, [nextHrefWhenHasKeys]);
}
