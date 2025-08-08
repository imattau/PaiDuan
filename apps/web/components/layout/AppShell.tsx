'use client';
import React from 'react';

export default function AppShell({
  left,
  center,
  right,
}: { left: React.ReactNode; center: React.ReactNode; right: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-app text-foreground">
      <div className="mx-auto w-full max-w-[1400px] grid grid-cols-1 lg:grid-cols-[300px_1fr_400px] gap-0">
        {/* Left column: menu/search/profile summary (sticky on desktop) */}
        <aside className="hidden lg:block border-r divider sticky top-0 h-screen overflow-y-auto">
          <div className="p-4">{left}</div>
        </aside>

        {/* Middle column: main feed */}
        <main className="min-h-screen">
          <div className="max-w-2xl mx-auto px-4 py-6">{center}</div>
        </main>

        {/* Right column: author info & comments (sticky on desktop) */}
        <aside className="hidden lg:block border-l divider sticky top-0 h-screen overflow-y-auto">
          <div className="p-4">{right}</div>
        </aside>
      </div>
    </div>
  );
}
