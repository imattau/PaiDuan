"use client";
import { useEffect, useRef, useState } from 'react';
import { trimVideoWebCodecs } from '@/utils/trimVideoWebCodecs';

interface Props {
  file: File;
  onDone: (blob: Blob) => void;
  onCancel: () => void;
}

export default function UploadModal({ file, onDone, onCancel }: Props) {
  const [progress, setProgress] = useState(0);
  const cancelRef = useRef(false);

  function cancel() {
    cancelRef.current = true;
    onCancel();
  }

  useEffect(() => {
    cancelRef.current = false;
    (async () => {
      try {
        let blob: Blob = file;
        if (file.type !== 'video/webm') {
          const converted = await trimVideoWebCodecs(file, 0);
          if (cancelRef.current) return;
          blob = converted;
          setProgress(50);
        } else {
          setProgress(50);
        }
        await new Promise((r) => setTimeout(r, 500));
        if (cancelRef.current) return;
        setProgress(100);
        onDone(blob);
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      cancelRef.current = true;
    };
  }, [file, onDone]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-80 rounded bg-background p-4 text-foreground">
        <h2 className="mb-4 font-semibold">Uploading…</h2>
        <div className="mb-4 h-2 w-full overflow-hidden rounded bg-black/20">
          <div
            className="h-full bg-accent transition-all"
            style={{ width: progress + '%' }}
          />
        </div>
        <button className="px-3 py-1" onClick={cancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
