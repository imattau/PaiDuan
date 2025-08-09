'use client';

import NextLink from 'next/link';
import { useRouter, usePathname, useSearchParams, useParams } from 'next/navigation';
import { navigation } from '@/config/navigation';
import { isRouteActive } from '@/utils/navigation';
import { useLayout } from '@/context/LayoutContext';
import {
  Flex,
  Link as ChakraLink,
  useColorModeValue,
} from '@chakra-ui/react';

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = (params?.locale as string) || undefined;
  const layout = useLayout();
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const activeColor = useColorModeValue('blue.600', 'blue.300');
  const inactiveColor = useColorModeValue('gray.600', 'gray.400');
  if (layout === 'desktop') return null;

  return (
    <Flex
      as="nav"
      position="fixed"
      bottom={0}
      insetX={0}
      justify="space-around"
      borderTop="1px"
      borderColor={borderColor}
      bg={bg}
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
            flex="1"
            p={3}
            color={active ? activeColor : inactiveColor}
            _hover={{ color: activeColor }}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            prefetch={false}
            onMouseEnter={() => router.prefetch(path)}
          >
            <Icon size={24} />
          </ChakraLink>
        );
      })}
    </Flex>
  );
}

