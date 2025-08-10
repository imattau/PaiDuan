import React from 'react';
import clsx from 'clsx';

export default function PlaceholderVideo({
  className,
  message = 'Loading video…',
  busy = true,
}: {
  className?: string;
  message?: string;
  busy?: boolean;
}) {
  return (
    <div
      className={clsx('relative flex items-center justify-center', className)}
      role="status"
      aria-busy={busy}
      aria-live="polite"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-full w-full animate-pulse text-muted"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="18" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
      {message && (
        <span className="absolute inset-0 flex items-center justify-center text-sm text-muted">
          {message}
        </span>
      )}
    </div>
  );
}
