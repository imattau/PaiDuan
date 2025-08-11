'use client';

import 'screen-orientation';
import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useMediaQuery } from '@chakra-ui/react';

export type LayoutType = 'desktop' | 'tablet' | 'mobile';

const LayoutContext = createContext<LayoutType | undefined>(undefined);
let orientationLocked = false;

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [isDesktop] = useMediaQuery('(min-width: 1280px)');
  const [isTablet] = useMediaQuery('(min-width: 1024px)');
  const layout: LayoutType = isDesktop ? 'desktop' : isTablet ? 'tablet' : 'mobile';

  useEffect(() => {
    const unlock = () => {
      if (!orientationLocked) return;
      try {
        screen.orientation.unlock();
      } catch {
        // ignore orientation unlock failures
      }
      if (document.fullscreenElement) {
        try {
          document.exitFullscreen();
        } catch {
          // ignore fullscreen exit failures
        }
      }
      orientationLocked = false;
    };

    if (layout === 'mobile') {
      const lockPortrait = async () => {
        if (orientationLocked) return;
        try {
          await document.documentElement.requestFullscreen();
          await screen.orientation.lock('portrait');
          orientationLocked = true;
        } catch {
          // ignore orientation lock failures
        }
      };
      document.addEventListener('click', lockPortrait, { once: true });
      return () => {
        document.removeEventListener('click', lockPortrait);
        unlock();
      };
    }

    unlock();
    return undefined;
  }, [layout]);

  return <LayoutContext.Provider value={layout}>{children}</LayoutContext.Provider>;
}

export function useLayout(): LayoutType {
  const ctx = useContext(LayoutContext);
  if (!ctx) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('useLayout used outside LayoutProvider; defaulting to desktop layout');
    }
    return 'desktop';
  }
  return ctx;
}
