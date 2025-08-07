import { useState } from 'react';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

const ffmpeg = createFFmpeg({ log: true });

export default function CreatePage() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      setError('Max file size is 50MB.');
      return;
    }
    setError(null);
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setProcessedBlob(null);
  }

  async function handleTrimAndConvert() {
    if (!videoFile) return;
    setError(null);
    setProcessing(true);

    try {
      if (!ffmpeg.isLoaded()) await ffmpeg.load();

      const inputName = 'input.mp4';
      const outputName = 'output.webm';

      ffmpeg.FS('writeFile', inputName, await fetchFile(videoFile));

      await ffmpeg.run(
        '-i',
        inputName,
        '-vf',
        'crop=in_h*9/16:in_h',
        '-c:v',
        'libvpx-vp9',
        '-b:v',
        '1M',
        '-an',
        outputName
      );

      const data = ffmpeg.FS('readFile', outputName);
      const webmBlob = new Blob([data.buffer], { type: 'video/webm' });
      setProcessedBlob(webmBlob);
      setVideoPreview(URL.createObjectURL(webmBlob));
    } catch (err) {
      console.error(err);
      setError('Conversion failed. Try another video.');
    } finally {
      setProcessing(false);
    }
  }

  async function handleUpload() {
    if (!processedBlob?.type.includes('webm')) {
      alert('Video must be in .webm format');
      return;
    }
    // TODO: Implement upload logic
  }

  return (
    <main className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">Create Video</h1>

      <div className="bg-white dark:bg-neutral-900 border rounded-2xl p-6 space-y-4 shadow">
        <label className="text-sm font-medium block">
          Select Video
          <input
            type="file"
            accept="video/*"
            className="mt-1 block w-full text-sm border rounded px-3 py-2"
            onChange={handleFileChange}
          />
        </label>

        {videoPreview && (
          <video
            controls
            src={videoPreview}
            className="rounded-xl w-full aspect-[9/16] object-cover"
          />
        )}

        <div className="flex gap-4 pt-4">
          <button
            onClick={handleTrimAndConvert}
            disabled={!videoFile || processing}
            className="bg-accent text-white px-4 py-2 rounded-lg hover:brightness-110 disabled:opacity-50"
          >
            {processing ? 'Processing...' : 'Trim & Convert'}
          </button>
          <button
            onClick={handleUpload}
            disabled={!processedBlob}
            className="border px-4 py-2 rounded-lg disabled:opacity-50"
          >
            Upload
          </button>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}
      </div>
    </main>
  );
}

