import {getRequestConfig} from 'next-intl/server';

export default getRequestConfig(async ({requestLocale}) => {
  const locale = requestLocale ?? 'en';

  return {
    locale,
    messages: (await import(`../locales/${locale}/common.json`)).default
  };
});
