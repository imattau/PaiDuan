import { useTranslations } from 'next-intl';

export default function useT() {
  return useTranslations('common');
}

