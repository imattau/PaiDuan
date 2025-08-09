import type { ReadonlyURLSearchParams } from 'next/navigation';

export function isRouteActive(
  path: string,
  pathname: string,
  searchParams: ReadonlyURLSearchParams,
  locale?: string,
) {
  const currentUrl = new URL(
    pathname + (searchParams.toString() ? `?${searchParams}` : ''),
    'http://localhost',
  );
  const targetUrl = new URL(path, 'http://localhost');
  let currentPath = currentUrl.pathname;
  if (locale) currentPath = currentPath.replace(new RegExp(`^/${locale}`), '');

  return (
    currentPath === targetUrl.pathname &&
    (targetUrl.search
      ? currentUrl.search === targetUrl.search
      : currentUrl.search === '')
  );
}
