'use client';
import { useRouter } from 'next/navigation';
import { UploadStep } from './UploadStep';

export default function CreatorWizard() {
  const router = useRouter();

  const handleCancel = () => {
    router.back();
  };

  return (
    <main className="max-w-2xl mx-auto py-12 px-4 space-y-6">
      <UploadStep onBack={handleCancel} onCancel={handleCancel} />
    </main>
  );
}
