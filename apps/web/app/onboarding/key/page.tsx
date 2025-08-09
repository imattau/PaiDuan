'use client';

import { useRouter } from 'next/navigation';
import KeySetupStep from '@/components/onboarding/KeySetupStep';
import OnboardingLayout from '@/components/onboarding/OnboardingLayout';

export default function KeyOnboardingPage() {
  const router = useRouter();
  return (
    <OnboardingLayout>
      <KeySetupStep onComplete={() => router.push('/onboarding/profile')} />
    </OnboardingLayout>
  );
}

