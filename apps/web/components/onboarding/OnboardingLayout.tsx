'use client';

import Logo from '@/components/branding/Logo';
import HeroArt from '@/components/branding/HeroArt';
import type { ReactNode } from 'react';

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <section className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-background-primary">
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-6">
        <Logo width={180} height={40} />
        <HeroArt className="w-full max-w-xs text-primary" />
        <p className="text-lg opacity-80 max-w-md">
          Lightning-fast short video, powered by Nostr and Lightning.
        </p>
      </div>
      <div className="flex items-center justify-center p-8">
        {children}
      </div>
    </section>
  );
}

