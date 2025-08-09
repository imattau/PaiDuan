'use client';

import NextLink from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { navItems } from './nav';
import { useLayout } from '@/context/LayoutContext';
import {
  Flex,
  Link as ChakraLink,
  useColorModeValue,
} from '@chakra-ui/react';

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
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
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <ChakraLink
            key={href}
            as={NextLink}
            href={href}
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
            onMouseEnter={() => router.prefetch(href)}
          >
            <Icon size={24} />
          </ChakraLink>
        );
      })}
    </Flex>
  );
}

