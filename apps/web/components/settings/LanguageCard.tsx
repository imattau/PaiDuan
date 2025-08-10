"use client";

import React from 'react';
import { useRouter, usePathname, useSearchParams, useParams } from 'next/navigation';
import useT from '@/hooks/useT';
import { Card } from '@/components/ui/Card';

export function LanguageCard() {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const handleLocaleChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const next = e.target.value;
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', next);
      document.cookie = `locale=${next}; path=/; max-age=31536000`;
      const path = (
        pathname + (searchParams.toString() ? `?${searchParams}` : '')
      ).replace(/^\/[a-zA-Z-]+/, '');
      router.push(`/${next}${path}`);
    }
  };

  return (
    <Card title={t('language')}>
      <select
        value={locale}
        onChange={handleLocaleChange}
        className="rounded border border-white/30 bg-background-secondary px-3 py-1"
      >
        <option value="en">{t('language_english')}</option>
        <option value="zh">{t('language_chinese')}</option>
        <option value="ar">{t('language_arabic')}</option>
      </select>
    </Card>
  );
}

export default LanguageCard;
