import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
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
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-64 -translate-x-1/2 -translate-y-1/2 rounded bg-background-primary p-4 text-primary focus:outline-none">
          <Dialog.Title className="mb-2 text-lg font-semibold">Send sats</Dialog.Title>
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
          <Dialog.Close asChild>
            <button onClick={onClose} className="mt-3 text-sm underline hover:text-accent-primary">
              Cancel
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default ZapModal;
