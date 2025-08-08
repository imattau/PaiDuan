import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Range, getTrackBackground } from 'react-range';
import { SimplePool } from 'nostr-tools';
import { VideoCardProps } from './VideoCard';
import { trimVideo } from '../utils/trimVideo';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

interface CreatorWizardProps {
  onClose: () => void;
  onPublished: (item: VideoCardProps) => void;
}

const MAX_DURATION = 180; // 3 minutes

export const CreatorWizard: React.FC<CreatorWizardProps> = ({ onClose, onPublished }) => {
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [duration, setDuration] = useState(0);
  const [range, setRange] = useState<[number, number]>([0, 0]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const recordingRef = useRef<HTMLVideoElement>(null);

  const [posterUrl, setPosterUrl] = useState('');
  const [posterBlob, setPosterBlob] = useState<Blob | null>(null);

  const [caption, setCaption] = useState('');
  const [progress, setProgress] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [trimming, setTrimming] = useState(false);
  const [mode, setMode] = useState<'upload' | 'record'>('upload');

  const { state } = useAuth();

  const handleFile = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    setVideoUrl(url);
    setFile(blob);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const onLoaded = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.duration > MAX_DURATION) {
      toast.error('Video must be 3 minutes or less');
      setFile(null);
      setVideoUrl('');
      setPosterBlob(null);
      setPosterUrl('');
      return;
    }
    setDuration(video.duration);
    setRange([0, video.duration]);
    setStep(1);
  };

  // Recording via getUserMedia
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      recordingRef.current!.srcObject = stream;
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        handleFile(blob);
        stream.getTracks().forEach((t) => t.stop());
        recordingRef.current!.srcObject = null;
      };
      recorder.start();
      setRecording(true);
    } catch (err) {
      toast.error('Unable to access camera');
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };


  const capturePoster = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) {
        setPosterBlob(blob);
        setPosterUrl(URL.createObjectURL(blob));
      }
    }, 'image/jpeg');
  };

  const upload = async (video: Blob, poster?: Blob) => {
    return new Promise<{ video: string; poster: string }>((resolve, reject) => {
      const form = new FormData();
      form.append('file', video, 'video.mp4');
      if (poster) form.append('poster', poster, 'poster.jpg');
      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'https://nostr.media/api/upload');
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        try {
          const json = JSON.parse(xhr.responseText);
          resolve({ video: json.video, poster: json.poster });
        } catch (err) {
          reject(err);
        }
      };
      xhr.onerror = reject;
      xhr.send(form);
    });
  };

  const publish = async () => {
    if (!file) return;
    try {
      setPublishing(true);
      const uploadRes = await upload(file, posterBlob || undefined).catch((err) => {
        toast.error('Upload failed');
        throw err;
      });
      const transRes = await fetch('/api/transcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ src: uploadRes.video }),
      }).then((r) => r.json());
      const pool = new SimplePool();
      const event: any = {
        kind: 30023,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ['v', uploadRes.video],
          ['image', uploadRes.poster],
          ['t', caption],
          ['vman', transRes.manifest],
        ],
        content: '',
        pubkey: state.status === 'ready' ? state.pubkey : undefined,
      };
      const lnaddr = localStorage.getItem('lnaddr');
      if (lnaddr) {
        event.tags.push(['zap', lnaddr]);
      }
      if (state.status !== 'ready') throw new Error('signer required');
      const signed = await state.signer.signEvent(event);
      await pool.publish(['wss://relay.damus.io', 'wss://nos.lol'], signed);
      const newItem: VideoCardProps = {
        videoUrl: uploadRes.video,
        posterUrl: uploadRes.poster,
        manifestUrl: transRes.manifest,
        author: 'you',
        caption,
        eventId: signed.id,
        lightningAddress: lnaddr || '',
        pubkey: signed.pubkey,
        zapTotal: 0,
        onLike: () => console.log('like'),
      };
      onPublished(newItem);
      toast.success('Video published');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Publish failed');
    } finally {
      setPublishing(false);
    }
  };

  const handleNext = async () => {
    if (!file) return;
    try {
      setTrimming(true);
      const trimmed = await trimVideo(file, range[0], range[1]);
      setFile(trimmed);
      setVideoUrl(URL.createObjectURL(trimmed));
      setStep(2);
    } catch (err) {
      console.error(err);
      toast.error('Trim failed');
    } finally {
      setTrimming(false);
    }
  };

  const renderStep1 = () => (
    <div className="p-4 space-y-4">
      <div className="mb-4 space-x-4">
        <label className="cursor-pointer">
          <input
            type="radio"
            className="mr-1"
            checked={mode === 'upload'}
            onChange={() => setMode('upload')}
          />
          Upload
        </label>
        <label className="cursor-pointer">
          <input
            type="radio"
            className="mr-1"
            checked={mode === 'record'}
            onChange={() => setMode('record')}
          />
          Record
        </label>
      </div>

      {videoUrl && (
        <video
          ref={videoRef}
          src={videoUrl}
          style={{ display: 'none' }}
          onLoadedMetadata={onLoaded}
        />
      )}

      {/* Upload input */}
      {mode === 'upload' && (
        <input
          type="file"
          accept="video/mp4,video/webm"
          onChange={handleFileInput}
          capture="environment"
          disabled={!!file || recording}
        />
      )}

      {/* Record UI */}
      {mode === 'record' && (
        <>
          <video
            ref={recordingRef}
            autoPlay
            playsInline
            muted
            className="w-full rounded border"
          />
          <button
            onClick={recording ? stopRecording : startRecording}
            className="mt-2 rounded bg-blue-500 px-4 py-2 text-white"
            disabled={!!file}
          >
            {recording ? 'Stop' : 'Record'}
          </button>
        </>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="p-4 space-y-4">
      <video ref={videoRef} src={videoUrl} controls className="w-full" />
      <Range
        values={range}
        min={0}
        max={duration}
        step={0.1}
        onChange={(values) => setRange([values[0], values[1]])}
        renderTrack={({ props, children }) => {
          const { key, ...trackProps } = props as { key?: string } & React.HTMLAttributes<HTMLDivElement>;
          return (
            <div
              key={key}
              {...trackProps}
              style={{
                height: '4px',
                background: getTrackBackground({
                  values: range,
                  colors: ['#ccc', '#548BF4', '#ccc'],
                  min: 0,
                  max: duration,
                }),
                width: '100%',
              }}
            >
              {children}
            </div>
          );
        }}
        renderThumb={({ props }) => {
          const { key, ...thumbProps } = props as { key?: string } & React.HTMLAttributes<HTMLDivElement>;
          return (
            <div
              key={key}
              {...thumbProps}
              style={{
                height: '12px',
                width: '12px',
                backgroundColor: '#FFF',
                border: '1px solid #999',
              }}
            />
          );
        }}
      />
      <div className="flex space-x-2">
        <button onClick={capturePoster} className="rounded bg-blue-500 px-4 py-2 text-white">
          Capture Poster
        </button>
        {posterUrl && (
          <Image
            src={posterUrl}
            alt="poster"
            width={1280}
            height={720}
            className="h-16 w-auto"
            unoptimized
          />
        )}
      </div>
      <button
        onClick={handleNext}
        disabled={!posterBlob || trimming}
        className="flex items-center justify-center rounded bg-green-500 px-4 py-2 text-white disabled:opacity-50"
      >
        {trimming && (
          <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        )}
        {trimming ? 'Trimming...' : 'Next'}
      </button>
    </div>
  );

  const renderStep3 = () => (
    <div className="p-4 space-y-4">
      <video src={videoUrl} controls className="w-full" />
      {posterUrl && (
        <Image
          src={posterUrl}
          alt="poster"
          width={1280}
          height={720}
          className="h-32 w-auto"
          unoptimized
        />
      )}
      <input
        type="text"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Caption"
        className="w-full rounded border p-2"
      />
      <div className="h-2 w-full bg-gray-200">
        <div className="h-full bg-blue-500" style={{ width: `${progress}%` }} />
      </div>
      <button
        disabled={publishing}
        onClick={publish}
        className="flex items-center justify-center rounded bg-green-500 px-4 py-2 text-white disabled:opacity-50"
      >
        {publishing && (
          <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        )}
        {publishing ? 'Publishing...' : 'Publish'}
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-md rounded bg-white text-black">
        <div className="flex justify-end p-2">
          <button onClick={onClose}>✕</button>
        </div>
        {step === 0 && renderStep1()}
        {step === 1 && renderStep2()}
        {step === 2 && renderStep3()}
      </div>
    </div>
  );
};

export default CreatorWizard;
