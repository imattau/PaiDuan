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
  // Start with a consistent value on server and client to avoid hydration mismatch
  const [layout, setLayout] = useState<LayoutType>('mobile');

  useEffect(() => {
    const stored = window.localStorage.getItem('layout') as LayoutType | null;
    const initial = stored ?? getLayout(window.innerWidth);
    setLayout(initial);
    window.localStorage.setItem('layout', initial);

    const handleResize = () => {
      const value = getLayout(window.innerWidth);
      setLayout(value);
      window.localStorage.setItem('layout', value);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
