import { NextIntlClientProvider, getMessages } from 'next-intl/server';
import CreatePage from '../../create/page';

export default async function LocaleCreatePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();
  const createMessages = (await import(`@/locales/${locale}/create.json`)).default;

  return (
    <NextIntlClientProvider locale={locale} messages={{ ...messages, create: createMessages }}>
      <CreatePage />
    </NextIntlClientProvider>
  );
}
