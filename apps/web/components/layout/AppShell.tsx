'use client';
import React from 'react';
import BottomNav from './BottomNav';
import { useLayout } from '@/context/LayoutContext';

export default function AppShell({
  left,
  center,
  right,
}: {
  left: React.ReactNode;
  center: React.ReactNode;
  right?: React.ReactNode;
}) {
  const layout = useLayout();
  const isDesktop = layout === 'desktop';
  const hasRight = !!right;
  const gridCols = isDesktop
    ? hasRight
      ? 'grid-cols-[300px_1fr_400px]'
      : 'grid-cols-[300px_1fr]'
    : 'grid-cols-1';

  return (
    <div className="min-h-screen bg-background-primary text-primary">
      <div className={`mx-auto w-full max-w-[1400px] bg-surface grid ${gridCols} gap-0`}>
        {/* Left column: menu/search/profile summary (sticky on desktop) */}
        {isDesktop && (
          <aside className="border-r divider sticky top-0 h-screen overflow-y-auto">
            <div className="p-4">{left}</div>
          </aside>
        )}

        {/* Middle column: main feed */}
        <main className="h-[100dvh] overflow-hidden">
          <div className="max-w-2xl mx-auto h-full px-4">{center}</div>
        </main>

        {/* Right column: author info & comments (sticky on desktop) */}
        {hasRight && isDesktop && (
          <aside className="sidebar-right border-l divider sticky top-0 h-screen overflow-y-auto">
            {right}
          </aside>
        )}
      </div>
      {layout !== 'desktop' && <BottomNav />}
    </div>
  );
}
