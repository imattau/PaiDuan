'use client';
import React from 'react';
import BottomNav from './BottomNav';
import { useLayout } from '@/context/LayoutContext';
import { Grid, GridItem, Box, useColorModeValue } from '@chakra-ui/react';

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
  const templateColumns = isDesktop
    ? hasRight
      ? '300px 1fr 400px'
      : '300px 1fr'
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
        {hasRight && isDesktop && (
          <GridItem
            as="aside"
            borderLeft="1px"
            borderColor={borderColor}
            position="sticky"
            top={0}
            h="100vh"
            overflowY="auto"
          >
            {right}
          </GridItem>
        )}
      </Grid>
      {hasRight && !isDesktop && right}
      {layout !== 'desktop' && <BottomNav />}
    </Box>
  );
}
