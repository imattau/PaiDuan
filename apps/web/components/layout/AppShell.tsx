'use client';
import React from 'react';
import BottomNav from './BottomNav';
import { useLayout } from '@/context/LayoutContext';
import { Box, useColorModeValue } from '@chakra-ui/react';

export default function AppShell({
  left: _left,
  center,
  right,
}: {
  left: React.ReactNode;
  center: React.ReactNode;
  right?: React.ReactNode;
}) {
  const layout = useLayout();
  const hasRight = !!right;
  const [viewport, setViewport] = React.useState({ width: 0, height: 0 });
  React.useEffect(() => {
    const handle = () =>
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    handle();
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  const isLandscape = viewport.width > viewport.height;
  const isLargeLandscape = isLandscape && viewport.width >= 1024;
  const sideNavWidth = isLargeLandscape ? 56 : 0;
  const feedWidth = isLargeLandscape
    ? Math.min((viewport.height * 9) / 16, viewport.width - sideNavWidth)
    : undefined;
  const bg = useColorModeValue('gray.50', 'gray.900');
  const surface = useColorModeValue('white', 'gray.800');

  return (
    <Box
      minH="100vh"
      style={{ minHeight: 'calc(100dvh - var(--bottom-nav-height, 0))' }}
      bg={bg}
    >
      <Box
        w="full"
        bg={surface}
        pl={sideNavWidth ? `${sideNavWidth}px` : 0}
        minH="100vh"
        style={{ minHeight: 'calc(100dvh - var(--bottom-nav-height, 0))' }}
      >
        <Box
          mx="auto"
          h="full"
          px={4}
          w="full"
          maxW={feedWidth ? `${feedWidth}px` : undefined}
        >
          {center}
        </Box>
      </Box>
      {hasRight &&
        (React.isValidElement(right)
          ? React.cloneElement(right as React.ReactElement<any>, {
              forceDrawer: true,
            })
          : right)}
      {isLargeLandscape ? <BottomNav orientation="vertical" /> : layout !== 'desktop' && <BottomNav />}
    </Box>
  );
}
