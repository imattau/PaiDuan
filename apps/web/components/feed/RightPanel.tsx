'use client';
import React from 'react';
import Link from 'next/link';
import Thread from '@/components/comments/Thread';
import { useFeedSelection } from '@/store/feedSelection';

export default function RightPanel({
  author,
  onFilterByAuthor,
}: {
  author?: { avatar: string; name: string; username: string; pubkey: string; followers: number };
  onFilterByAuthor: (pubkey: string) => void;
}) {
  const { selectedVideoId, selectedVideoAuthor } = useFeedSelection();
  return (
    <div className="space-y-6">
      {author && (
        <div className="bg-card border border-token rounded-2xl p-4">
          <div className="flex gap-3">
            <img src={author.avatar} className="w-12 h-12 rounded-full object-cover" alt="" />
            <div>
              <div className="font-semibold">{author.name}</div>
              <div className="text-sm text-muted-foreground">@{author.username}</div>
              <div className="text-xs text-muted-foreground mt-1">{author.followers.toLocaleString()} followers</div>
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

      <div className="bg-card border border-token rounded-2xl p-0">
        <Thread rootId={selectedVideoId} authorPubkey={selectedVideoAuthor} />
      </div>
    </div>
  );
}
