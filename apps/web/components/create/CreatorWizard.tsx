'use client';
import CreateVideoForm from './CreateVideoForm';

export default function CreatorWizard() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)] px-4 gap-6 lg:flex-row">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Create Video</h1>
      </div>
      <CreateVideoForm />
    </div>
  );
}
