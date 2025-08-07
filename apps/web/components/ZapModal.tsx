import React, { useState } from 'react';
import useLightning from '../hooks/useLightning';
import { toast } from 'react-hot-toast';

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
      toast.error('Split payout failed – zap cancelled');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70">
      <div className="w-64 rounded bg-background p-4 text-foreground">
        <h2 className="mb-2 text-lg font-semibold">Send sats</h2>
        <div className="mb-2 flex space-x-2">
          {preset.map((p) => (
            <button
              key={p}
              onClick={() => send(p)}
              className="flex-1 rounded border px-2 py-1 hover:bg-accent hover:text-white"
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
            className="flex-1 rounded border px-2 py-1 bg-background"
            placeholder="Custom"
          />
          <button
            onClick={() => custom && send(Number(custom))}
            className="rounded border px-2 py-1 hover:bg-accent hover:text-white"
          >
            Zap
          </button>
        </div>
        <button onClick={onClose} className="mt-3 text-sm underline hover:text-accent">
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ZapModal;
