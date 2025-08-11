import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import useT from '../../hooks/useT';
import { Card } from '../ui/Card';
import { themes } from '@/agents/theme';

export function AppearanceCard() {
  const { resolvedTheme, setTheme } = useTheme();
  const [accent, setAccent] = useState('violet');
  const t = useT();
  const accents = ['violet', 'blue', 'green', 'pink'];
  const accentColors: Record<string, string> = {
    violet: 'hsl(252 56% 57%)',
    blue: 'hsl(206 100% 50%)',
    green: 'hsl(151 55% 42%)',
    pink: 'hsl(322 65% 55%)',
  };

  useEffect(() => {
    document.documentElement.dataset.accent = accent;
  }, [accent]);

  return (
    <Card title="Appearance" desc="Theme and accent colour.">
      <select
        value={resolvedTheme ?? 'light'}
        onChange={(e) => setTheme(e.target.value)}
        className="select select-bordered"
      >
        {themes.map((th) => (
          <option key={th} value={th}>
            {t(`theme_${th}`)}
          </option>
        ))}
      </select>
      <div className="flex flex-wrap gap-2 pt-2">
        {accents.map((c) => (
          <button
            key={c}
            aria-pressed={accent === c}
            onClick={() => setAccent(c)}
            className="relative h-7 w-7 rounded-full ring-offset-2 focus-visible:ring-2"
            style={{ backgroundColor: accentColors[c] }}
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
