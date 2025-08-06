import React, { useState } from 'react';
import { Zap } from 'lucide-react';
import ZapModal from './ZapModal';

interface ZapButtonProps {
  lightningAddress: string;
  eventId?: string;
  pubkey: string;
  total?: number;
}

export const ZapButton: React.FC<ZapButtonProps> = ({ lightningAddress, eventId, pubkey, total = 0 }) => {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(total);

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex flex-col items-center text-white">
        <Zap />
        <span className="text-xs">{count}</span>
      </button>
      {open && (
        <ZapModal
          lightningAddress={lightningAddress}
          eventId={eventId}
          pubkey={pubkey}
          onClose={() => setOpen(false)}
          onSuccess={(amt) => setCount((c) => c + amt)}
        />
      )}
    </>
  );
};

export default ZapButton;
