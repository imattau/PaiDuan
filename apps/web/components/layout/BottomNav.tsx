'use client';

import { useEffect, useCallback, useMemo } from 'react';
import NextLink from 'next/link';
import { useRouter, usePathname, useSearchParams, useParams } from 'next/navigation';
import { getNavigation } from '@/config/navigation';
import { isRouteActive } from '@/utils/navigation';
import { useLayout } from '@/hooks/useLayout';
import { useAuth } from '@/hooks/useAuth';
import { Flex, Link as ChakraLink, useColorModeValue } from '@chakra-ui/react';

interface BottomNavProps {
  orientation?: 'horizontal' | 'vertical';
}

export default function BottomNav({ orientation = 'horizontal' }: BottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = (params?.locale as string) || undefined;
  const layout = useLayout();
  const { state } = useAuth();
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const activeColor = useColorModeValue('blue.600', 'blue.300');
  const inactiveColor = useColorModeValue('gray.600', 'gray.400');

  const navigation = useMemo(() => getNavigation(state.status === 'ready'), [state.status]);

  const prefetch = useCallback(
    (path: string) => {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        router.prefetch(path);
      }
    },
    [router],
  );

  useEffect(() => {
    const handlePrefetch = () => {
      if (
        typeof document !== 'undefined' &&
        document.visibilityState === 'visible' &&
        typeof navigator !== 'undefined' &&
        navigator.onLine
      ) {
        navigation.forEach(({ path }) => router.prefetch(path));
      }
    };

    handlePrefetch();
    window.addEventListener('online', handlePrefetch);
    document.addEventListener('visibilitychange', handlePrefetch);
    return () => {
      window.removeEventListener('online', handlePrefetch);
      document.removeEventListener('visibilitychange', handlePrefetch);
    };
  }, [router, navigation]);

  const isVertical = orientation === 'vertical';

  useEffect(() => {
    if (isVertical) {
      document.documentElement.style.removeProperty('--bottom-nav-height');
      const width = 56;
      document.documentElement.style.setProperty('--side-nav-width', `${width}px`);
      return () => {
        document.documentElement.style.removeProperty('--side-nav-width');
      };
    }
    if (layout === 'desktop') {
      document.documentElement.style.removeProperty('--bottom-nav-height');
      return;
    }
    const height = 56;
    document.documentElement.style.setProperty('--bottom-nav-height', `${height}px`);
    return () => {
      document.documentElement.style.removeProperty('--bottom-nav-height');
    };
  }, [layout, isVertical]);
  if (layout === 'desktop' && !isVertical) return null;

  return (
    <Flex
      as="nav"
      position="fixed"
      bottom={isVertical ? undefined : 0}
      top={isVertical ? 0 : undefined}
      insetX={isVertical ? undefined : 0}
      left={isVertical ? 0 : undefined}
      justify={isVertical ? 'flex-start' : 'space-around'}
      borderTop={isVertical ? undefined : '1px'}
      borderRight={isVertical ? '1px' : undefined}
      borderColor={borderColor}
      bg={bg}
      h={isVertical ? 'full' : '14'}
      w={isVertical ? '14' : undefined}
      flexDirection={isVertical ? 'column' : undefined}
    >
      {navigation.map(({ path, label, icon: Icon }) => {
        const active = isRouteActive(path, pathname, searchParams, locale);
        return (
          <ChakraLink
            key={path}
            as={NextLink}
            href={path}
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            flex={isVertical ? 'none' : '1'}
            p={3}
            color={active ? activeColor : inactiveColor}
            _hover={{ color: activeColor }}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            prefetch={false}
            onMouseEnter={() => prefetch(path)}
          >
            <Icon size={24} />
          </ChakraLink>
        );
      })}
    </Flex>
  );
}

