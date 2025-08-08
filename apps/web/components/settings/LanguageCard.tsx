import React from 'react';
import { useRouter } from 'next/router';
import useT from '@/hooks/useT';
import { Card } from '@/components/ui/Card';

export function LanguageCard() {
  const t = useT();
  const router = useRouter();
  const locale = (router.query.locale as string) || 'en';

  const handleLocaleChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const next = e.target.value;
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', next);
      document.cookie = `locale=${next}; path=/; max-age=31536000`;
      const path = router.asPath.replace(/^\/[a-zA-Z-]+/, '');
      router.push(`/${next}${path}`);
    }
  };

  return (
    <Card title={t('language')}>
      <select
        value={locale}
        onChange={handleLocaleChange}
        className="rounded border border-white/30 bg-brand-panel px-3 py-1"
      >
        <option value="en">{t('language_english')}</option>
        <option value="zh">{t('language_chinese')}</option>
        <option value="ar">{t('language_arabic')}</option>
      </select>
    </Card>
  );
}

export default LanguageCard;
