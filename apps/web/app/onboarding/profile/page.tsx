'use client';

import { useRouter } from 'next/navigation';
import ProfileSetupStep from '@/components/onboarding/ProfileSetupStep';
import OnboardingLayout from '@/components/onboarding/OnboardingLayout';

export default function ProfileOnboardingPage() {
  const router = useRouter();
  return (
    <OnboardingLayout>
      <ProfileSetupStep
        onComplete={() => {
          localStorage.setItem('pd.onboarded', '1');
          router.replace('/feed');
        }}
      />
    </OnboardingLayout>
  );
}

