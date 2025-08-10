'use client';
import React from 'react';
import BottomNav from './BottomNav';
import { useLayout } from '@/context/LayoutContext';
import {
  Grid,
  GridItem,
  Box,
  useBreakpointValue,
  useColorModeValue,
} from '@chakra-ui/react';

export default function AppShell({
  left,
  center,
  right,
}: {
  left: React.ReactNode;
  center: React.ReactNode;
  right?: React.ReactNode;
}) {
  const layout = useLayout();
  const isDesktop = layout === 'desktop';
  const hasRight = !!right;

  // Responsive column widths
  const leftColumnWidth = useBreakpointValue({
    base: '0px',
    lg: 'clamp(240px, 20vw, 300px)',
  });
  const rightColumnWidth = useBreakpointValue({
    base: '0px',
    lg: 'clamp(280px, 25vw, 400px)',
  });

  // Numeric widths for layout calculations
  const leftWidthPx = useBreakpointValue({ base: 0, lg: 260 });
  const rightWidthPx = useBreakpointValue({ base: 0, lg: 360 });

  const [windowWidth, setWindowWidth] = React.useState(0);
  React.useEffect(() => {
    const handle = () => setWindowWidth(window.innerWidth);
    handle();
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  const containerWidth = Math.min(windowWidth, 1400);
  const feedWidth = containerWidth - (leftWidthPx ?? 0) - (hasRight ? rightWidthPx ?? 0 : 0);
  const collapseRight = hasRight && feedWidth < 640;

  const templateColumns = isDesktop
    ? hasRight && !collapseRight
      ? `${leftColumnWidth} 1fr ${rightColumnWidth}`
      : `${leftColumnWidth} 1fr`
    : '1fr';
  const bg = useColorModeValue('gray.50', 'gray.900');
  const surface = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box minH="100vh" bg={bg}>
      <Grid
        mx="auto"
        w="full"
        maxW="1400px"
        bg={surface}
        templateColumns={templateColumns}
        gap={0}
      >
        {/* Left column: menu/search/profile summary (sticky on desktop) */}
        {isDesktop && (
          <GridItem
            as="aside"
            borderRight="1px"
            borderColor={borderColor}
            position="sticky"
            top={0}
            h="100vh"
            overflowY="auto"
            p={4}
          >
            {left}
          </GridItem>
        )}

        {/* Middle column: main feed */}
        <GridItem as="main" h="100vh" overflow="hidden">
          <Box maxW="2xl" mx="auto" h="full" px={4}>
            {center}
          </Box>
        </GridItem>

        {/* Right column: author info & comments (sticky on desktop) */}
        {hasRight && isDesktop && !collapseRight && (
          <GridItem
            as="aside"
            borderLeft="1px"
            borderColor={borderColor}
            position="sticky"
            top={0}
            h="100vh"
            overflowY="auto"
          >
            {React.isValidElement(right)
              ? React.cloneElement(right as React.ReactElement<any>, {
                  forceDrawer: collapseRight,
                })
              : right}
          </GridItem>
        )}
      </Grid>
      {hasRight && (!isDesktop || collapseRight) &&
        (React.isValidElement(right)
          ? React.cloneElement(right as React.ReactElement<any>, {
              forceDrawer: collapseRight,
            })
          : right)}
      {layout !== 'desktop' && <BottomNav />}
    </Box>
  );
}
