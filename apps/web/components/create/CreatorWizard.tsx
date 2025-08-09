'use client';
import CreateVideoForm from './CreateVideoForm';

export default function CreatorWizard() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)] px-4 gap-6 xl:flex-row">
      <div className="flex flex-col items-start gap-2 xl:max-w-xs flex-none">
        <h1 className="text-3xl font-bold">Create Video</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Choose how you want to add a video—upload from your device or import from a URL—and publish
          it to the Nostr network.
        </p>
      </div>
      <div className="flex-1 min-w-0">
        <CreateVideoForm />
      </div>
    </div>
  );
}
