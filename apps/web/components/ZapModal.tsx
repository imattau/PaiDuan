import React, { useState } from 'react';
import useLightning from '../hooks/useLightning';
import { toast } from 'react-hot-toast';
import Overlay from './ui/Overlay';

interface ZapModalProps {
  lightningAddress: string;
  eventId?: string;
  pubkey: string;
  onSuccess: (amount: number) => void;
}

const preset = [100, 500, 1000];

function ZapModalContent({ lightningAddress, eventId, pubkey, onSuccess }: ZapModalProps) {
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
    Overlay.close();
  };

  return (
    <div className="w-64 p-4 text-primary">
      <h2 className="mb-2 text-lg font-semibold">Send sats</h2>
      <div className="mb-2 flex space-x-2">
        {preset.map((p) => (
          <button
            key={p}
            onClick={() => send(p)}
            className="flex-1 rounded border px-2 py-1 hover:bg-accent-primary hover:text-white"
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
          className="flex-1 rounded border px-2 py-1 bg-background-primary"
          placeholder="Custom"
        />
        <button
          onClick={() => custom && send(Number(custom))}
          className="rounded border px-2 py-1 hover:bg-accent-primary hover:text-white"
        >
          Zap
        </button>
      </div>
      <button onClick={() => Overlay.close()} className="mt-3 text-sm underline hover:text-accent-primary">
        Cancel
      </button>
    </div>
  );
}

export default function ZapModal(props: ZapModalProps) {
  Overlay.open('modal', { content: <ZapModalContent {...props} /> });
}
