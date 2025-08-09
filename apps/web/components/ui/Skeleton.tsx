import React from 'react';

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded bg-text-primary/10 ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-text-primary/20 to-transparent" />
    </div>
  );
}

export default Skeleton;
