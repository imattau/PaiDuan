'use client';

import { useRouter } from 'next/navigation';
import ProfileSetupStep from '@/components/onboarding/ProfileSetupStep';

export default function ProfileOnboardingPage() {
  const router = useRouter();
  return (
    <ProfileSetupStep
      onComplete={() => {
        localStorage.setItem('pd.onboarded', '1');
        router.replace('/feed');
      }}
    />
  );
}
