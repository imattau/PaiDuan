"use client";

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isChunkError =
    error.name === 'ChunkLoadError' || /loading chunk/i.test(error.message);

  const reload = () => window.location.reload();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      {isChunkError ? (
        <>
          <h2 className="mb-4 text-2xl font-semibold">
            A new version is available
          </h2>
          <p className="mb-6">Please reload the page to continue.</p>
        </>
      ) : (
        <h2 className="mb-6 text-2xl font-semibold">Something went wrong</h2>
      )}
      <button onClick={reload} className="btn btn-primary">
        Reload
      </button>
    </main>
  );
}

