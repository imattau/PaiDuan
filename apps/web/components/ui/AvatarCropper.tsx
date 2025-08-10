'use client';

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';

export interface AvatarCropperProps {
  image: string;
  onComplete: (dataUrl: string) => void;
  onCancel?: () => void;
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = document.createElement('img');
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = url;
  });
}

export function AvatarCropper({ image, onComplete, onCancel }: AvatarCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);

  const onCropComplete = useCallback((_area: Area, cropped: Area) => {
    setCroppedArea(cropped);
  }, []);

  const finishCrop = useCallback(async () => {
    if (!croppedArea) return;
    const imageEl = await createImage(image);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const size = Math.min(croppedArea.width, croppedArea.height);
    canvas.width = size;
    canvas.height = size;
    ctx.drawImage(
      imageEl,
      croppedArea.x,
      croppedArea.y,
      size,
      size,
      0,
      0,
      size,
      size
    );
    const dataUrl = canvas.toDataURL('image/png');
    onComplete(dataUrl);
  }, [croppedArea, image, onComplete]);

  return (
    <div className="space-y-2">
      <div className="relative h-64 w-64">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          cropShape="round"
          aspect={1}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          showGrid={false}
        />
      </div>
      <div className="flex gap-2 justify-center">
        <input
          type="range"
          min={1}
          max={3}
          step={0.1}
          value={zoom}
          onChange={(e) => setZoom(parseFloat(e.target.value))}
        />
        <button className="btn btn-outline" onClick={finishCrop}>
          Done
        </button>
        {onCancel && (
          <button className="btn btn-outline" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

export default AvatarCropper;

