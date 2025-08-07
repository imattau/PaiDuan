import React from 'react';

interface Props {
  label: string;
  total: number | string;
  delta?: number;
}

export function StatCard({ label, total, delta }: Props) {
  return (
    <div className="rounded border p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-bold">{total}</div>
      {typeof delta === 'number' && (
        <div className={delta >= 0 ? 'text-green-600' : 'text-red-600'}>
          {delta >= 0 ? '+' : ''}
          {delta.toFixed(1)}%
        </div>
      )}
    </div>
  );
}

export default StatCard;
