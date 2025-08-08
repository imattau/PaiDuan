import React from 'react';
import Skeleton from './Skeleton';

export function SkeletonComment() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-full" />
    </div>
  );
}

export default SkeletonComment;
