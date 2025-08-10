import React from 'react';
import Skeleton from './Skeleton';

export function SkeletonVideoCard() {
  return (
    <div className="relative mx-auto w-full max-w-full max-h-[calc(100dvh-var(--bottom-nav-height,0))] sm:max-h-[calc(100vh-var(--bottom-nav-height,0))] aspect-[9/16] overflow-hidden rounded-2xl bg-text-primary/10 min-[aspect-ratio:16/9]:h-[calc(100dvh-var(--bottom-nav-height,0))] min-[aspect-ratio:16/9]:w-auto">
      <Skeleton className="h-full w-full" />
      <div className="absolute bottom-0 left-0 w-full p-4">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="mt-2 h-4 w-3/4" />
      </div>
    </div>
  );
}

export default SkeletonVideoCard;
