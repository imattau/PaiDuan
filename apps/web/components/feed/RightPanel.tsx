'use client';
import React from 'react';
import NextLink from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Thread from '@/components/comments/Thread';
import { useFeedSelection } from '@/store/feedSelection';
import { useLayout } from '@/context/LayoutContext';
import {
  Box,
  Button,
  Link as ChakraLink,
  Stack,
  Drawer,
  DrawerContent,
  DrawerOverlay,
  DrawerBody,
  useColorModeValue,
} from '@chakra-ui/react';

export default function RightPanel({
  author,
  onFilterByAuthor,
}: {
  author?: { avatar: string; name: string; username: string; pubkey: string; followers: number };
  onFilterByAuthor: (pubkey: string) => void;
}) {
  const { selectedVideoId, selectedVideoAuthor } = useFeedSelection();
  const router = useRouter();
  const layout = useLayout();
  const isDesktop = layout === 'desktop';
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
              onError={(e) => (e.currentTarget.src = '/offline.jpg')}
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
                <ChakraLink
                  as={NextLink}
                  href={`/p/${author.pubkey}`}
                  prefetch={false}
                  onMouseEnter={() => router.prefetch(`/p/${author.pubkey}`)}
                  px={3}
                  py={1.5}
                  borderWidth="1px"
                  borderRadius="md"
                >
                  View profile
                </ChakraLink>
                <Button size="sm" colorScheme="blue" onClick={() => onFilterByAuthor(author.pubkey)}>
                  Filter by author
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Box>
      )}

      {selectedVideoId && (
        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={0}>
          <Thread rootId={selectedVideoId} authorPubkey={selectedVideoAuthor} />
        </Box>
      )}
    </Stack>
  );

  if (isDesktop) {
    return panelContent;
  }

  const isOpen = !!(author || selectedVideoId);
  return (
    <Drawer isOpen={isOpen} placement="right" onClose={() => {}}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerBody p={4}>{panelContent}</DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
