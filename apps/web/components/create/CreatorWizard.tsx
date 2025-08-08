'use client';
import { useRouter } from 'next/navigation';
import { CreateVideoForm } from './CreateVideoForm';

export default function CreatorWizard() {
  const router = useRouter();

  const handleCancel = () => {
    router.back();
  };

  return (
    <main className="mx-auto py-12 px-4 space-y-6 lg:py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Create Video</h1>
      </div>
      <CreateVideoForm onCancel={handleCancel} />
    </main>
  );
}
