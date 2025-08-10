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
  const messages = await getMessages();
  const createMessages = (await import(`@/locales/${locale}/create.json`)).default;

  return (
    <NextIntlClientProvider locale={locale} messages={{ ...messages, create: createMessages }}>
      <CreatePageClient />
    </NextIntlClientProvider>
  );
}
