'use client';
import React from 'react';
import Link from 'next/link';
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
  return (
    <div className="p-[1.2rem] space-y-4">
      {author && (
        <div className={`${cardStyle} p-4`}>
          <div className="flex gap-3">
            <img src={author.avatar} className="w-12 h-12 rounded-full object-cover" alt="" />
            <div>
              <div className="font-semibold">{author.name}</div>
              <div className="text-sm text-muted">@{author.username}</div>
              <div className="text-[0.9rem] font-light text-muted mt-1">
                {author.followers.toLocaleString()} followers
              </div>
              <div className="mt-3 flex gap-2">
                <Link href={`/p/${author.pubkey}`} className="btn btn-secondary">
                  View profile
                </Link>
                <button className="btn btn-primary" onClick={() => onFilterByAuthor(author.pubkey)}>
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
