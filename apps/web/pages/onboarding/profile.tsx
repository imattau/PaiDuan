import ProfileSetupStep from '@/components/onboarding/ProfileSetupStep';

export default function ProfileOnboarding() {
  return (
    <ProfileSetupStep
      onComplete={() => {
        localStorage.setItem('pd.onboarded', '1');
        window.location.href = '/feed';
      }}
    />
  );
}
