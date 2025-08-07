import React from 'react';
import { useTheme } from '../hooks/useTheme';

const swatches = ['#3b82f6', '#f43f5e', '#10b981', '#f59e0b', '#6366f1', '#ec4899'];

export default function SettingsPage() {
  const { mode, toggleMode, accent, setAccent } = useTheme();

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
    <div className="min-h-screen bg-background p-4 text-foreground space-y-6">
      <div className="rounded border border-foreground/20 p-4">
        <h2 className="mb-2 text-lg font-semibold">Appearance</h2>
        <button
          onClick={toggleMode}
          className="rounded border border-foreground/20 px-3 py-1 hover:bg-accent hover:text-white"
        >
          {mode === 'dark' ? 'Switch to light' : 'Switch to dark'}
        </button>
      </div>
      <div className="rounded border border-foreground/20 p-4">
        <h2 className="mb-2 text-lg font-semibold">Accent Colour</h2>
        <div className="flex space-x-2">
          {swatches.map((c) => (
            <button
              key={c}
              onClick={() => setAccent(c)}
              style={{ backgroundColor: c }}
              className="h-8 w-8 rounded-full border border-foreground/20"
            />
          ))}
          <input
            type="color"
            value={accent}
            onChange={(e) => setAccent(e.target.value)}
            className="h-8 w-8 rounded-full border border-foreground/20 p-0"
          />
        </div>
      </div>
      <div className="rounded border border-foreground/20 p-4">
        <h2 className="mb-2 text-lg font-semibold">Storage</h2>
        <button
          onClick={clearStorage}
          className="rounded border border-foreground/20 px-3 py-1 hover:bg-accent hover:text-white"
        >
          Clear cached data
        </button>
      </div>
    </div>
  );
}
