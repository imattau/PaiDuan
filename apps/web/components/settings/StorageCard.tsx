import React from 'react';
import useT from '../../hooks/useT';
import { Card } from '../ui/Card';

export function StorageCard() {
  const t = useT();

  const clearStorage = () => {
    if (typeof window === 'undefined') return;
    const keys = ['feed-tab', 'feed-tag', 'unseen-notifications', 'following'];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith('followers-')) keys.push(k);
    }
    keys.forEach((k) => window.localStorage.removeItem(k));
  };

  return (
    <Card title="Storage" desc="Local caches and data.">
      <button onClick={clearStorage} className="btn btn-outline">
        {t('clear_cached_data')}
      </button>
    </Card>
  );
}

export default StorageCard;
