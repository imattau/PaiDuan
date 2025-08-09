'use client';
import NextLink from 'next/link';
import SearchBar from '@/components/SearchBar';
import MiniProfileCard from '@/components/MiniProfileCard';
import NotificationBell from '@/components/NotificationBell';
import { Sun, Moon } from 'lucide-react';
import { useRouter, usePathname, useSearchParams, useParams } from 'next/navigation';
import Logo from '@/components/branding/Logo';
import { navigation } from '@/config/navigation';
import { isRouteActive } from '@/utils/navigation';
import { useLayout } from '@/context/LayoutContext';
import {
  Box,
  VStack,
  HStack,
  Link as ChakraLink,
  IconButton,
  useColorMode,
  useColorModeValue,
} from '@chakra-ui/react';

interface MainNavProps {
  me?: {
    avatar: string;
    name: string;
    username: string;
    stats: { followers: number; following: number };
  };
  showSearch?: boolean;
  showProfile?: boolean;
}

export default function MainNav({
  me,
  showSearch = true,
  showProfile = true,
}: MainNavProps) {
  const { colorMode, toggleColorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = (params?.locale as string) || undefined;
  const layout = useLayout();
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.800');
  const muted = useColorModeValue('gray.600', 'gray.400');
  const activeColor = useColorModeValue('blue.600', 'blue.300');
  const hoverBg = useColorModeValue('blue.50', 'whiteAlpha.200');

  return (
    <VStack p="1.2rem" spacing={4} align="stretch">
      <ChakraLink as={NextLink} href="/" pl={5} prefetch>
        <Logo width={160} height={34} />
      </ChakraLink>

      {/* Search */}
      {showSearch && layout !== 'mobile' && <SearchBar showActions={false} />}

      {/* Profile mini card */}
      {showProfile && layout === 'desktop' && <MiniProfileCard stats={me?.stats} />}

      {/* Nav */}
      <Box as="nav" bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={2}>
        <VStack align="stretch">
          {navigation.map(({ path, label, icon: Icon }) => {
            const active = isRouteActive(path, pathname, searchParams, locale);
            return (
              <ChakraLink
                key={path}
                as={NextLink}
                href={path}
                display="flex"
                alignItems="center"
                gap={2}
                px={3}
                py={2}
                borderRadius="lg"
                fontWeight="bold"
                aria-current={active ? 'page' : undefined}
                prefetch={false}
                onMouseEnter={() => router.prefetch(path)}
                color={active ? activeColor : muted}
                bg={active ? hoverBg : 'transparent'}
                _hover={{ bg: hoverBg, color: activeColor }}
                _focusVisible={{ boxShadow: 'outline' }}
              >
                <Icon size={20} /> {label}
              </ChakraLink>
            );
          })}
        </VStack>
      </Box>

      {/* Actions */}
      <HStack
        bg={cardBg}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="lg"
        p={2}
        justify="space-between"
      >
        <IconButton
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          icon={isDark ? <Sun size={20} /> : <Moon size={20} />}
          onClick={toggleColorMode}
          variant="ghost"
        />
        <NotificationBell />
      </HStack>

    </VStack>
  );
}
