'use client';

import { useRouter } from 'next/navigation';
import KeySetupStep from '@/components/onboarding/KeySetupStep';

export default function KeyOnboardingPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <KeySetupStep onComplete={() => router.push('/onboarding/profile')} />
    </div>
  );
}
