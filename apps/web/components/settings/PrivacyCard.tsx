import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card';

export function PrivacyCard() {
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setAnalytics(localStorage.getItem('analytics-consent') === '1');
  }, []);

  const toggleAnalytics = (next: boolean) => {
    setAnalytics(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('analytics-consent', next ? '1' : '0');
      window.location.reload();
    }
  };

  return (
    <Card title="Privacy" desc="Analytics and diagnostics.">
      <Row title="Send anonymous usage data" desc="Helps us find crashes and slow spots." control={<Switch checked={analytics} onCheckedChange={toggleAnalytics} />} />
    </Card>
  );
}

function Row({ title, desc, control }: { title: string; desc: string; control: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <div className="font-medium text-sm">{title}</div>
        <div className="text-xs text-muted">{desc}</div>
      </div>
      {control}
    </div>
  );
}

function Switch({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  return (
    <button role="switch" aria-checked={checked} onClick={() => onCheckedChange(!checked)} className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ring-offset-2 focus-visible:ring-2 ${checked ? 'bg-accent-primary' : 'bg-text-primary/20'}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-1'}`} />
    </button>
  );
}

export default PrivacyCard;
