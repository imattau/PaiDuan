import React from 'react';
import Skeleton from './Skeleton';

export function SkeletonVideoCard() {
  return (
    <div className="relative mx-auto h-[calc(100dvh-var(--bottom-nav-height,0))] w-full sm:h-[calc(100vh-var(--bottom-nav-height,0))] overflow-hidden rounded-2xl bg-text-primary/10">
      <Skeleton className="h-full w-full" />
      <div className="absolute top-0 left-0 right-0 p-4 flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="mt-2 h-4 w-3/4" />
        </div>
        <Skeleton className="h-6 w-6" />
      </div>
    </div>
  );
}

export default SkeletonVideoCard;
