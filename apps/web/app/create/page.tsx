import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
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
  const commonMessages = await getMessages();
  const createMessages = (await import(`@/locales/${locale}/create.json`)).default;

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={{ ...commonMessages, create: createMessages }}
    >
      <CreatePageClient />
    </NextIntlClientProvider>
  );
}
