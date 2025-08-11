'use client';
import React from 'react';
import NextLink from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Thread from '@/components/comments/Thread';
import { useFeedSelection } from '@/store/feedSelection';
import { useLayout } from '@/hooks/useLayout';
import { useProfile } from '@/hooks/useProfile';
import useFollowerCount from '@/hooks/useFollowerCount';
import { useAvatar } from '@/hooks/useAvatar';
import {
  Box,
  Stack,
  Drawer,
  DrawerContent,
  DrawerOverlay,
  DrawerBody,
  useColorModeValue,
  useDisclosure,
  Button,
} from '@chakra-ui/react';

export default function RightPanel({
  onFilterByAuthor,
  forceDrawer = false,
}: {
  onFilterByAuthor: (pubkey: string) => void;
  forceDrawer?: boolean;
}) {
  const { selectedVideoId, selectedVideoAuthor } = useFeedSelection();
  const router = useRouter();
  const layout = useLayout();
  const { isOpen, onClose } = useDisclosure();
  const isDesktop = layout === 'desktop' && !forceDrawer;
  const shouldLoad = isDesktop || isOpen;
  const profile = useProfile(shouldLoad ? selectedVideoAuthor : undefined);
  const followers = useFollowerCount(shouldLoad ? selectedVideoAuthor : undefined);
  const avatarUrl = useAvatar(
    shouldLoad && selectedVideoAuthor && !profile?.picture
      ? selectedVideoAuthor
      : undefined,
  );
  const author =
    selectedVideoAuthor && profile
      ? {
          avatar: profile.picture || avatarUrl,
          name: profile.name || selectedVideoAuthor.slice(0, 8),
          username: profile.name || selectedVideoAuthor.slice(0, 8),
          pubkey: selectedVideoAuthor,
          followers,
        }
      : undefined;
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.800');

  const panelContent = (
    <Stack spacing={4}>
      {author && (
        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={4}>
          <Stack direction="row" spacing={3}>
            <Image
              src={author.avatar}
              alt={author.name}
              width={48}
              height={48}
              style={{ borderRadius: '50%', objectFit: 'cover' }}
              crossOrigin="anonymous"
              unoptimized
            />
            <Box>
              <Box fontWeight="semibold">{author.name}</Box>
              <Box fontSize="sm" color="gray.500">
                @{author.username}
              </Box>
              <Box mt={1} fontSize="sm" color="gray.500">
                {author.followers.toLocaleString()} followers
              </Box>
              <Stack mt={3} direction="row" spacing={2}>
                <Button
                  as={NextLink}
                  href={`/p/${author.pubkey}`}
                  prefetch={false}
                  onMouseEnter={() => router.prefetch(`/p/${author.pubkey}`)}
                  size="sm"
                  colorScheme="blue"
                >
                  View profile
                </Button>
                <Button size="sm" colorScheme="blue" onClick={() => onFilterByAuthor(author.pubkey)}>
                  Filter by author
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Box>
      )}

      {selectedVideoId && shouldLoad && (
        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={0}>
          <Thread rootId={selectedVideoId} authorPubkey={selectedVideoAuthor} />
        </Box>
      )}
    </Stack>
  );

  if (isDesktop) {
    return panelContent;
  }

  return (
    <>
      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          {shouldLoad && <DrawerBody p={4}>{panelContent}</DrawerBody>}
        </DrawerContent>
      </Drawer>
    </>
  );
}
