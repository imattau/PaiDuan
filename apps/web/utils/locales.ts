export const locales = ['en', 'zh', 'ar'] as const;
export type Locale = typeof locales[number];
export const otherLocales = locales.filter((locale) => locale !== 'en');
