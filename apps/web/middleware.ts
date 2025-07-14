import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest } from 'next/server';
import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';

export default async function middleware(request: NextRequest) {
  const headers = {
    'accept-language': request.headers.get('accept-language') ?? undefined,
  };
  const negotiator = new Negotiator({ headers });
  const language = negotiator.languages();

  const defaultLocale = match(
    language,
    routing.locales,
    routing.defaultLocale,
  ) as (typeof routing.locales)[number];

  const handleI18nRouting = createMiddleware({
    locales: ['en', 'zh'],
    defaultLocale: defaultLocale,
  });
  const response = handleI18nRouting(request);

  return response;
}

export const config = {
  matcher: [
    // Skip all internal paths (_next)
    '/((?!_next).*)',
    // Optional: only run on root (/) URL
    // '/',
  ],
};
