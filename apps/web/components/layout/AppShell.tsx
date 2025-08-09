'use client';
import React from 'react';
import BottomNav from './BottomNav';

export default function AppShell({
  left,
  center,
  right,
}: {
  left: React.ReactNode;
  center: React.ReactNode;
  right?: React.ReactNode;
}) {
  const hasRight = !!right;
  return (
    <div className="min-h-screen bg-background-primary text-primary">
      <div
        className={`mx-auto w-full max-w-[1400px] bg-surface grid grid-cols-1 ${
          hasRight
            ? 'lg:grid-cols-[300px_1fr_400px]'
            : 'lg:grid-cols-[300px_1fr]'
        } gap-0`}
      >
        {/* Left column: menu/search/profile summary (sticky on desktop) */}
        <aside className="hidden lg:block border-r divider sticky top-0 h-screen overflow-y-auto">
          <div className="p-4">{left}</div>
        </aside>

        {/* Middle column: main feed */}
        <main className="h-screen overflow-y-auto">
          <div className="max-w-2xl mx-auto h-full px-4">{center}</div>
        </main>

        {/* Right column: author info & comments (sticky on desktop) */}
        {hasRight && (
          <aside className="hidden lg:block border-l divider sticky top-0 h-screen overflow-y-auto">
            <div className="p-4">{right}</div>
          </aside>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
