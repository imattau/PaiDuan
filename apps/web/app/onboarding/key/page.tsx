'use client';

import { useRouter } from 'next/navigation';
import KeySetupStep from '@/components/onboarding/KeySetupStep';

export default function KeyOnboardingPage() {
  const router = useRouter();
  return (
    <section className="min-h-screen py-16 px-4 flex flex-col items-center justify-center text-center bg-background">
      <div className="w-full max-w-md mx-auto flex justify-center">
        <KeySetupStep onComplete={() => router.push('/onboarding/profile')} />
      </div>
    </section>
  );
}
