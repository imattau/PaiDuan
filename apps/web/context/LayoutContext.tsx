'use client';

import 'screen-orientation';
import { createContext, useContext, useEffect, useState } from 'react';

export type LayoutType = 'desktop' | 'tablet' | 'mobile';

function getLayout(width: number, height: number): LayoutType {
  const isPortrait = height >= width;
  const desktopWidth = isPortrait ? 1280 : 1024;
  if (width >= desktopWidth) return 'desktop';
  if (width >= 640) return 'tablet';
  return 'mobile';
}

export const LayoutContext = createContext<LayoutType | undefined>(undefined);

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  // Start with a consistent value on server and client to avoid hydration mismatch
  const [layout, setLayout] = useState<LayoutType>('mobile');

  useEffect(() => {
    // Restore last chosen layout from localStorage so offline launches
    // still render using the previous preference.
    const readStored = () => {
      try {
        return window.localStorage.getItem('layout') as LayoutType | null;
      } catch {
        return null;
      }
    };

    const writeStored = (value: LayoutType) => {
      try {
        window.localStorage.setItem('layout', value);
      } catch {
        // ignore storage write failures (e.g. quota exceeded, private mode)
      }
    };

    const initial = readStored() ?? getLayout(window.innerWidth, window.innerHeight);
    setLayout(initial);
    writeStored(initial);

    if (initial === 'mobile') {
      try {
        screen.orientation.lock('portrait');
      } catch {
        // ignore orientation lock failures
      }
    }

    const handleResize = () => {
      const value = getLayout(window.innerWidth, window.innerHeight);
      setLayout(value);
      writeStored(value);

      if (value === 'mobile') {
        try {
          screen.orientation.lock('portrait');
        } catch {
          // ignore orientation lock failures
        }
      } else {
        try {
          screen.orientation.unlock();
        } catch {
          // ignore orientation unlock failures
        }
      }
    };

    const mql = window.matchMedia('(orientation: portrait)');
    mql.addEventListener('change', handleResize);
    window.addEventListener('resize', handleResize);
    return () => {
      mql.removeEventListener('change', handleResize);
      window.removeEventListener('resize', handleResize);
      try {
        screen.orientation.unlock();
      } catch {
        // ignore orientation unlock failures
      }
    };
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
