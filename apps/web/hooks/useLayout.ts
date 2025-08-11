'use client';

import 'screen-orientation';
import { useEffect } from 'react';
import { useMediaQuery } from '@chakra-ui/react';

export type LayoutType = 'desktop' | 'tablet' | 'mobile';

let orientationLocked = false;

export function useLayout(): LayoutType {
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

  return layout;
}
