'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type LayoutType = 'desktop' | 'tablet' | 'mobile';

function getLayout(width: number): LayoutType {
  if (width >= 1024) return 'desktop';
  if (width >= 640) return 'tablet';
  return 'mobile';
}

const LayoutContext = createContext<LayoutType>('desktop');

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [layout, setLayout] = useState<LayoutType>(() => {
    if (typeof window === 'undefined') return 'desktop';
    return getLayout(window.innerWidth);
  });

  useEffect(() => {
    const update = () => setLayout(getLayout(window.innerWidth));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return <LayoutContext.Provider value={layout}>{children}</LayoutContext.Provider>;
}

export function useLayout() {
  return useContext(LayoutContext);
}

