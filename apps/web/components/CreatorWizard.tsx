import React, { useState, useRef, useEffect } from 'react';
import { Range, getTrackBackground } from 'react-range';
import { SimplePool } from 'nostr-tools';
import { VideoCardProps } from './VideoCard';

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

  const [posterUrl, setPosterUrl] = useState('');
  const [posterBlob, setPosterBlob] = useState<Blob | null>(null);

  const [caption, setCaption] = useState('');
  const [progress, setProgress] = useState(0);
  const [publishing, setPublishing] = useState(false);

  const handleFile = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    setVideoUrl(url);
    setFile(blob);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
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
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        handleFile(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      setRecording(true);
    } catch (err) {
      alert('Unable to access camera');
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };

  useEffect(() => {
    if (!videoUrl) return;
    const video = videoRef.current;
    if (!video) return;
    const onLoaded = () => {
      if (video.duration > MAX_DURATION) {
        alert('Video must be 3 minutes or less');
        setFile(null);
        setVideoUrl('');
        return;
      }
      setDuration(video.duration);
      setRange([0, video.duration]);
      setStep(1);
    };
    video.addEventListener('loadedmetadata', onLoaded);
    return () => video.removeEventListener('loadedmetadata', onLoaded);
  }, [videoUrl]);

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
      const uploadRes = await upload(file, posterBlob || undefined);
      const pool = new SimplePool();
      const event: any = {
        kind: 30023,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ['v', uploadRes.video],
          ['image', uploadRes.poster],
          ['t', caption],
        ],
        content: '',
      };
      const nostr = (window as any).nostr;
      if (!nostr) throw new Error('nostr extension required');
      const signed = await nostr.signEvent(event);
      await pool.publish(['wss://relay.damus.io', 'wss://nos.lol'], signed);
      const newItem: VideoCardProps = {
        videoUrl: uploadRes.video,
        posterUrl: uploadRes.poster,
        author: 'you',
        caption,
        eventId: signed.id,
        lightningAddress: '',
        pubkey: signed.pubkey,
        zapTotal: 0,
        onLike: () => console.log('like'),
      };
      onPublished(newItem);
      alert('Video published');
      onClose();
    } catch (err) {
      console.error(err);
      alert('Publish failed');
    } finally {
      setPublishing(false);
    }
  };

  const renderStep1 = () => (
    <div className="p-4 space-y-4">
      <input
        type="file"
        accept="video/mp4,video/webm"
        onChange={handleFileInput}
        capture="environment"
      />
      {navigator.mediaDevices && (
        <button
          onClick={recording ? stopRecording : startRecording}
          className="rounded bg-blue-500 px-4 py-2 text-white"
        >
          {recording ? 'Stop' : 'Record'}
        </button>
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
        renderTrack={({ props, children }) => (
          <div
            {...props}
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
        )}
        renderThumb={({ props }) => (
          <div
            {...props}
            style={{
              height: '12px',
              width: '12px',
              backgroundColor: '#FFF',
              border: '1px solid #999',
            }}
          />
        )}
      />
      <div className="flex space-x-2">
        <button onClick={capturePoster} className="rounded bg-blue-500 px-4 py-2 text-white">
          Capture Poster
        </button>
        {posterUrl && <img src={posterUrl} className="h-16" />}
      </div>
      <button
        onClick={() => setStep(2)}
        className="rounded bg-green-500 px-4 py-2 text-white"
      >
        Next
      </button>
    </div>
  );

  const renderStep3 = () => (
    <div className="p-4 space-y-4">
      <video src={videoUrl} controls className="w-full" />
      {posterUrl && <img src={posterUrl} className="h-32" />}
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
        className="rounded bg-green-500 px-4 py-2 text-white disabled:opacity-50"
      >
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
