import {defineConfig} from 'next-intl';
import {locales} from './utils/locales';

export default defineConfig({
  locales,
  defaultLocale: 'en'
});
