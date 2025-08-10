import { NextIntlClientProvider } from 'next-intl';
import type { Metadata } from 'next';
import { locales } from '@/utils/locales';
import CreatePageClient from './CreatePageClient';

export const metadata: Metadata = {
  alternates: {
    languages: Object.fromEntries(
      locales.map((locale) => [locale, `/${locale}/create`]),
    ),
  },
};

export default async function CreatePage({
  params,
}: {
  params: Promise<{ locale?: string }>;
}) {
  const { locale = 'en' } = await params;
  const createMessages = (await import(`@/locales/${locale}/create.json`)).default;
  const commonMessages = (await import(`@/locales/${locale}/common.json`)).default;

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={{ common: commonMessages, create: createMessages }}
    >
      <CreatePageClient />
    </NextIntlClientProvider>
  );
}
