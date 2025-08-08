import React, { useEffect, useState } from 'react';
import { useTheme } from '@/context/themeContext';
import useT from '../hooks/useT';
import { useRouter } from 'next/router';
import useAlwaysSD from '../hooks/useAlwaysSD';
import { clearKey } from '../utils/keyStorage';
import { KeysCard } from '../components/settings/KeysCard';
import SideNav from '../components/SideNav';
import { Card } from '../components/ui/Card';

export default function Settings() {
  const { setMode, accent, setAccent } = useTheme();
  const [analytics, setAnalytics] = useState(false);
  const { alwaysSD, setAlwaysSD } = useAlwaysSD();
  const t = useT();
  const router = useRouter();
  const locale = (router.query.locale as string) || 'en';

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

  const clearStorage = () => {
    if (typeof window === 'undefined') return;
    const keys = ['feed-tab', 'feed-tag', 'unseen-notifications', 'following'];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith('followers-')) keys.push(k);
    }
    keys.forEach((k) => window.localStorage.removeItem(k));
  };

  const colors = ['#7c5cff', '#22c55e', '#06b6d4', '#f59e0b', '#a855f7', '#ef4444'];

  return (
    <>
      <SideNav />
      <main className="max-w-3xl mx-auto px-4 py-10 space-y-6 lg:ml-48">
        <KeysCard />

        <Card title="Appearance" desc="Theme and accent colour.">
          <button
            onClick={() =>
              setMode(
                typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
                  ? 'light'
                  : 'dark'
              )
            }
            className="btn btn-secondary"
          >
            {typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
              ? t('switch_to_light')
              : t('switch_to_dark')}
          </button>
          <div className="flex flex-wrap gap-2 pt-2">
            {colors.map((c) => (
              <button
                aria-pressed={accent === c}
                key={c}
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

        <Card title="Storage" desc="Local caches and data.">
          <button onClick={clearStorage} className="btn btn-secondary">
            {t('clear_cached_data')}
          </button>
        </Card>

        <Card title="Data" desc="Playback and usage data.">
          <Row
            title="Always play SD (240p)"
            desc="Reduce data usage on mobile."
            control={<Switch checked={alwaysSD} onCheckedChange={setAlwaysSD} />}
          />
        </Card>

        <Card title="Privacy" desc="Analytics and diagnostics.">
          <Row
            title="Send anonymous usage data"
            desc="Helps us find crashes and slow spots."
            control={<Switch checked={analytics} onCheckedChange={toggleAnalytics} />}
          />
        </Card>

        <Card title="Language">
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
        </Card>

        <Card title="Account">
          <button
            onClick={() => {
              clearKey();
              window.location.href = '/';
            }}
            className="btn btn-secondary"
          >
            🔓 Logout / Reset Identity
          </button>
        </Card>
      </main>
    </>
  );
}

function Row({ title, desc, control }: { title: string; desc: string; control: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <div className="font-medium text-sm">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      {control}
    </div>
  );
}

function Switch({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ring-offset-2 focus-visible:ring-2 ${
        checked ? 'bg-accent' : 'bg-foreground/20'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-1'
        }`}
      />
    </button>
  );
}
