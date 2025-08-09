import React, { useState } from 'react';
import { Zap } from 'lucide-react';
import ZapModal from './ZapModal';
import analytics from '../utils/analytics';

interface ZapButtonProps {
  lightningAddress: string;
  eventId?: string;
  pubkey: string;
  total?: number;
  disabled?: boolean;
  title?: string;
}

export const ZapButton: React.FC<ZapButtonProps> = ({
  lightningAddress,
  eventId,
  pubkey,
  total = 0,
  disabled,
  title,
}) => {
  const [count, setCount] = useState(total);

  return (
    <button
      onClick={() => {
        if (disabled) return;
        analytics.trackEvent('zap_click');
        ZapModal({
          lightningAddress,
          eventId,
          pubkey,
          onSuccess: (amt) => setCount((c) => c + amt),
        });
      }}
      className="flex flex-col items-center text-primary hover:text-accent-primary disabled:opacity-50"
      disabled={disabled}
      title={title}
    >
      <Zap />
      <span className="text-xs">{count}</span>
    </button>
  );
};

export default ZapButton;
