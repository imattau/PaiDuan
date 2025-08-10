import { NextRequest, NextResponse } from 'next/server';
import { locales, type Locale } from './utils/locales';
const PUBLIC_FILE = /\.(.*)$/;

function getLocale(req: NextRequest): Locale {
  const cookieLocale = req.cookies.get('locale')?.value as Locale | undefined;
  if (cookieLocale && locales.includes(cookieLocale)) return cookieLocale;
  const accept = req.headers.get('accept-language');
  if (accept) {
    const lang = accept.split(',')[0].split('-')[0] as Locale;
    if (locales.includes(lang)) return lang;
  }
  return 'en';
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_FILE.test(pathname) || pathname.startsWith('/_next') || pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Allow the root path to render without locale redirection so that
  // unauthenticated users can see the landing page hero.
  if (pathname === '/' || pathname.startsWith('/onboarding')) {
    return NextResponse.next();
  }

  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (hasLocale) return NextResponse.next();

  const locale = getLocale(req);
  return NextResponse.redirect(new URL(`/${locale}${pathname}`, req.url));
}

export const config = {
  matcher: ['/((?!_next|api).*)'],
};
