"use client";

import { useEffect, useState } from 'react';

export default function useAlwaysSD() {
  const [alwaysSD, setAlwaysSD] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setAlwaysSD(localStorage.getItem('always-sd') === '1');
  }, []);
  const update = (v: boolean) => {
    setAlwaysSD(v);
    if (typeof window !== 'undefined') {
      localStorage.setItem('always-sd', v ? '1' : '0');
    }
  };
  return { alwaysSD, setAlwaysSD: update };
}
