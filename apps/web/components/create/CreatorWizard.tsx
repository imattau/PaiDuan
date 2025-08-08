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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Create Video</h1>
      </div>
      <UploadStep onBack={handleCancel} onCancel={handleCancel} />
    </main>
  );
}
