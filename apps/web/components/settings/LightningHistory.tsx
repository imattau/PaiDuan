import React from 'react';
import { Card } from '../ui/Card';
import useZapHistory from '@/hooks/useZapHistory';

export function LightningHistory() {
  const { events, totalAmount, totalCount } = useZapHistory();

  return (
    <Card title="Lightning History" desc="Recent zaps and totals.">
      <div className="space-y-2">
        <div className="flex justify-between text-sm" data-testid="totals">
          <span data-testid="total-amount">{totalAmount} sats</span>
          <span data-testid="total-count">{totalCount} zaps</span>
        </div>
        <ul className="space-y-1">
          {events.map((e) => (
            <li key={e.id} className="flex justify-between text-sm">
              <span>{e.from.slice(0, 8)}</span>
              <span>{e.amount} sats</span>
              <span>{new Date(e.created_at * 1000).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

export default LightningHistory;
