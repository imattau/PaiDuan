import { defineRouting } from 'next-intl/routing';
import { locales } from './utils/locales';

export default defineRouting({
  locales,
  defaultLocale: 'en',
});
