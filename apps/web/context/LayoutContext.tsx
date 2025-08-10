'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type LayoutType = 'desktop' | 'tablet' | 'mobile';

function getLayout(width: number): LayoutType {
  if (width >= 1024) return 'desktop';
  if (width >= 640) return 'tablet';
  return 'mobile';
}

export const LayoutContext = createContext<LayoutType | undefined>(undefined);

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [layout, setLayout] = useState<LayoutType>(() => {
    if (typeof window === 'undefined') return 'mobile';
    const stored = window.localStorage.getItem('layout') as LayoutType | null;
    return stored ?? getLayout(window.innerWidth);
  });

  useEffect(() => {
    const update = () => {
      const value = getLayout(window.innerWidth);
      setLayout(value);
      window.localStorage.setItem('layout', value);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return <LayoutContext.Provider value={layout}>{children}</LayoutContext.Provider>;
}

export function useLayout() {
  const layout = useContext(LayoutContext);
  if (layout === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return layout;
}
