'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Thread from '@/components/comments/Thread';
import { useFeedSelection } from '@/store/feedSelection';
import { cardStyle } from '@/components/ui/Card';

export default function RightPanel({
  author,
  onFilterByAuthor,
}: {
  author?: { avatar: string; name: string; username: string; pubkey: string; followers: number };
  onFilterByAuthor: (pubkey: string) => void;
}) {
  const { selectedVideoId, selectedVideoAuthor } = useFeedSelection();
  const router = useRouter();
  return (
    <div className="space-y-4">
      {author && (
        <div className={`${cardStyle} p-4`}>
          <div className="flex gap-3">
            <Image
              src={author.avatar}
              alt={author.name}
              width={48}
              height={48}
              className="w-12 h-12 rounded-full object-cover"
              onError={(e) => (e.currentTarget.src = '/offline.jpg')}
              unoptimized
            />
            <div>
              <div className="font-semibold">{author.name}</div>
              <div className="username">@{author.username}</div>
              <div className="meta-info mt-1">
                {author.followers.toLocaleString()} followers
              </div>
              <div className="mt-3 flex gap-2">
                <Link
                  href={`/p/${author.pubkey}`}
                  className="btn btn-outline px-3 py-1.5 text-sm"
                  prefetch={false}
                  onMouseEnter={() => router.prefetch(`/p/${author.pubkey}`)}
                >
                  View profile
                </Link>
                <button
                  className="btn btn-primary px-3 py-1.5 text-sm"
                  onClick={() => onFilterByAuthor(author.pubkey)}
                >
                  Filter by author
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedVideoId && (
        <div className={`${cardStyle} p-0`}>
          <Thread rootId={selectedVideoId} authorPubkey={selectedVideoAuthor} />
        </div>
      )}
    </div>
  );
}
