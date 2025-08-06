import React, { useState } from 'react';
import useLightning from '../hooks/useLightning';

interface ZapModalProps {
  lightningAddress: string;
  eventId?: string;
  pubkey: string;
  onClose: () => void;
  onSuccess: (amount: number) => void;
}

const preset = [100, 500, 1000];

export const ZapModal: React.FC<ZapModalProps> = ({ lightningAddress, eventId, pubkey, onClose, onSuccess }) => {
  const { createZap } = useLightning();
  const [custom, setCustom] = useState('');

  const send = async (amt: number) => {
    try {
      await createZap({ lightningAddress, amount: amt, eventId, pubkey });
      onSuccess(amt);
    } catch (err) {
      console.error(err);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70">
      <div className="rounded bg-white p-4 text-black w-64">
        <h2 className="mb-2 text-lg font-semibold">Send sats</h2>
        <div className="mb-2 flex space-x-2">
          {preset.map((p) => (
            <button
              key={p}
              onClick={() => send(p)}
              className="flex-1 rounded border px-2 py-1"
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex space-x-2">
          <input
            type="number"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            className="flex-1 rounded border px-2 py-1"
            placeholder="Custom"
          />
          <button
            onClick={() => custom && send(Number(custom))}
            className="rounded border px-2 py-1"
          >
            Zap
          </button>
        </div>
        <button onClick={onClose} className="mt-3 text-sm underline">
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ZapModal;
