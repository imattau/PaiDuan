import React from 'react';
import { useTheme } from '@/context/themeContext';
import useT from '../../hooks/useT';
import { Card } from '../ui/Card';

export function AppearanceCard() {
  const { setMode, accent, setAccent } = useTheme();
  const t = useT();
  const colors = ['#7c5cff', '#22c55e', '#06b6d4', '#f59e0b', '#a855f7', '#ef4444'];
  const isDark =
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark');

  return (
    <Card title="Appearance" desc="Theme and accent colour.">
      <button
        onClick={() => setMode(isDark ? 'light' : 'dark')}
        className="btn btn-secondary"
      >
        {isDark ? t('switch_to_light') : t('switch_to_dark')}
      </button>
      <div className="flex flex-wrap gap-2 pt-2">
        {colors.map((c) => (
          <button
            key={c}
            aria-pressed={accent === c}
            onClick={() => setAccent(c)}
            className="relative h-7 w-7 rounded-full ring-offset-2 focus-visible:ring-2"
            style={{ backgroundColor: c }}
          >
            {accent === c && (
              <span className="absolute inset-0 grid place-items-center text-[10px]">✓</span>
            )}
          </button>
        ))}
      </div>
    </Card>
  );
}

export default AppearanceCard;
