'use client';
import dynamic from 'next/dynamic';
import SearchBar from '@/components/SearchBar';
import MiniProfileCard from '@/components/MiniProfileCard';

const CreatorWizard = dynamic(() => import('@/components/create/CreatorWizard'), { ssr: false });

export default function CreatePageClient() {
  return (
    <div className="box-border min-h-screen h-screen">
      <main className="mx-auto max-w-[1400px] px-4 h-full">
        <div className="grid h-full gap-6 grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_340px]">
          <aside className="hidden lg:block self-start sticky top-20 space-y-4">
            <SearchBar />
            <MiniProfileCard />
          </aside>

          <section className="xl:col-span-2">
            <CreatorWizard />
          </section>
        </div>
      </main>
    </div>
  );
}
