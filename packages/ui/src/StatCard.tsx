import React from 'react';

interface Props {
  label: string;
  total: number | string;
  delta?: number;
}

export function StatCard({ label, total, delta }: Props) {
  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body">
        <div className="stat">
          <div className="stat-title">{label}</div>
          <div className="stat-value">{total}</div>
          {typeof delta === 'number' && (
            <div className={`stat-desc ${delta >= 0 ? 'text-success' : 'text-error'}`}>
              {delta >= 0 ? '+' : ''}
              {delta.toFixed(1)}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StatCard;
