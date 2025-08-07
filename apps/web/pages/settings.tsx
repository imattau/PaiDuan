import React, { useEffect, useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import useT from '../hooks/useT';
import { useRouter } from 'next/router';
import useAlwaysSD from '../hooks/useAlwaysSD';
import SettingsLayout from '../components/SettingsLayout';

const swatches = ['#3b82f6', '#f43f5e', '#10b981', '#f59e0b', '#6366f1', '#ec4899'];

export default function SettingsPage() {
  const { mode, toggleMode, accent, setAccent } = useTheme();
  const [analytics, setAnalytics] = useState(false);
  const { alwaysSD, setAlwaysSD } = useAlwaysSD();
  const t = useT();
  const router = useRouter();
  const locale = (router.query.locale as string) || 'en';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setAnalytics(localStorage.getItem('analytics-consent') === '1');
  }, []);

  const toggleAnalytics = () => {
    const next = !analytics;
    setAnalytics(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('analytics-consent', next ? '1' : '0');
      window.location.reload();
    }
  };

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
    <SettingsLayout>
      <div className="space-y-6">
        <div className="rounded bg-brand-panel p-4">
          <h2 className="mb-2 text-lg font-semibold">{t('appearance')}</h2>
          <button onClick={toggleMode} className="btn-outline">
            {mode === 'dark' ? t('switch_to_light') : t('switch_to_dark')}
          </button>
        </div>
        <div className="rounded bg-brand-panel p-4">
          <h2 className="mb-2 text-lg font-semibold">{t('accent_colour')}</h2>
          <div className="flex space-x-2">
            {swatches.map((c) => (
              <button
                key={c}
                onClick={() => setAccent(c)}
                style={{ backgroundColor: c }}
                className="h-8 w-8 rounded-full border border-white/30"
              />
            ))}
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="h-8 w-8 rounded-full border border-white/30 p-0"
            />
          </div>
        </div>
        <div className="rounded bg-brand-panel p-4">
          <h2 className="mb-2 text-lg font-semibold">{t('storage')}</h2>
          <button onClick={clearStorage} className="btn-outline">
            {t('clear_cached_data')}
          </button>
        </div>
        <div className="rounded bg-brand-panel p-4">
          <h2 className="mb-2 text-lg font-semibold">{t('data')}</h2>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={alwaysSD}
              onChange={(e) => setAlwaysSD(e.target.checked)}
            />
            <span>{t('always_play_sd')}</span>
          </label>
        </div>
        <div className="rounded bg-brand-panel p-4">
          <h2 className="mb-2 text-lg font-semibold">{t('privacy')}</h2>
          <label className="flex items-center space-x-2">
            <input type="checkbox" checked={analytics} onChange={toggleAnalytics} />
            <span>{t('send_anonymous_usage_data')}</span>
          </label>
        </div>
        <div className="rounded bg-brand-panel p-4">
          <h2 className="mb-2 text-lg font-semibold">{t('language')}</h2>
          <select
            value={locale}
            onChange={(e) => {
              const next = e.target.value;
              if (typeof window !== 'undefined') {
                localStorage.setItem('locale', next);
                document.cookie = `locale=${next}; path=/; max-age=31536000`;
                const path = router.asPath.replace(/^\/[a-zA-Z-]+/, '');
                router.push(`/${next}${path}`);
              }
            }}
            className="rounded border border-white/30 bg-brand-panel px-3 py-1"
          >
            <option value="en">{t('language_english')}</option>
            <option value="zh">{t('language_chinese')}</option>
            <option value="ar">{t('language_arabic')}</option>
          </select>
        </div>
      </div>
    </SettingsLayout>
  );
}
