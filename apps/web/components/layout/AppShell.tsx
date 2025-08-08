'use client';
import React from 'react';

export default function AppShell({
  left,
  center,
  right,
}: { left: React.ReactNode; center: React.ReactNode; right: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-app text-foreground">
      <div className="mx-auto w-full max-w-[1400px] grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)_360px] gap-0">
        {/* Left column (sticky on desktop) */}
        <aside className="hidden lg:block border-r border-token sticky top-0 h-screen overflow-y-auto">
          <div className="p-4">{left}</div>
        </aside>

        {/* Center feed */}
        <main className="min-h-screen">
          <div className="max-w-2xl mx-auto px-4 py-6">{center}</div>
        </main>

        {/* Right column (sticky on desktop) */}
        <aside className="hidden lg:block border-l border-token sticky top-0 h-screen overflow-y-auto">
          <div className="p-4">{right}</div>
        </aside>
      </div>
    </div>
  );
}
