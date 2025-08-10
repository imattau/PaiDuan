import { describe, expect, it } from 'vitest';
import { metadata } from '@/app/create/page';
import { metadata as localizedMetadata } from '@/app/[locale]/create/page';
import { locales } from '@/utils/locales';

describe('create page metadata', () => {
  it('includes language alternates for each locale', () => {
    const expected = Object.fromEntries(
      locales.map((locale) => [locale, `/${locale}/create`]),
    );
    expect(metadata.alternates?.languages).toEqual(expected);
  });

  it('is re-exported by localized route', () => {
    expect(localizedMetadata).toEqual(metadata);
  });
});
