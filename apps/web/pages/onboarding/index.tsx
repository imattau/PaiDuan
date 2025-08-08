import { useState } from 'react';
import { useRouter } from 'next/router';
import KeySetupStep from '@/components/onboarding/KeySetupStep';
import ProfileSetupStep from '@/components/onboarding/ProfileSetupStep';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<'key' | 'profile'>('key');

  const handleProfileComplete = () => {
    localStorage.setItem('pd.onboarded', '1');
    router.replace('/feed');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {step === 'key' ? (
        <KeySetupStep onComplete={() => setStep('profile')} />
      ) : (
        <ProfileSetupStep onComplete={handleProfileComplete} />
      )}
    </div>
  );
}
