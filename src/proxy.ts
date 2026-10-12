import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';
import createIntlMiddleware from 'next-intl/middleware';

import { routing } from '@/core/i18n/config';

const intlMiddleware = createIntlMiddleware(routing);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle internationalization first
  const intlResponse = intlMiddleware(request);

  // Extract locale from pathname
  const locale = pathname.split('/')[1];
  const isValidLocale = routing.locales.includes(locale as any);
  const pathWithoutLocale = isValidLocale
    ? pathname.slice(locale.length + 1)
    : pathname;

  // SHEIN 授权检查 - 强制要求授权才能访问管理后台
  if (pathWithoutLocale.startsWith('/admin')) {
    // 授权相关页面不需要检查，允许访问
    if (
      !pathWithoutLocale.startsWith('/admin/shein-auth') &&
      !pathWithoutLocale.startsWith('/admin/shein-auth-callback')
    ) {
      // 检查环境变量中的授权状态
      const openKeyId = process.env.SHEIN_OPEN_KEY_ID;
      const secretKey = process.env.SHEIN_SECRET_KEY;
      const isAuthorized = !!(
        openKeyId &&
        secretKey &&
        openKeyId.trim() !== '' &&
        secretKey.trim() !== ''
      );

      // 如果未授权，重定向到授权页面
      if (!isAuthorized) {
        const authUrl = new URL(
          isValidLocale ? `/${locale}/admin/shein-auth` : '/admin/shein-auth',
          request.url
        );
        return NextResponse.redirect(authUrl);
      }
    }
  }

  intlResponse.headers.set('x-pathname', request.nextUrl.pathname);
  intlResponse.headers.set('x-url', request.url);

  // Remove Set-Cookie from public pages to allow caching
  // We exclude admin, settings, activity, and auth pages from this behavior
  if (
    !pathWithoutLocale.startsWith('/admin') &&
    !pathWithoutLocale.startsWith('/settings') &&
    !pathWithoutLocale.startsWith('/activity') &&
    !pathWithoutLocale.startsWith('/sign-') &&
    !pathWithoutLocale.startsWith('/auth')
  ) {
    intlResponse.headers.delete('Set-Cookie');

    // Cache-Control header for public pages
    const cacheControl = 'public, s-maxage=3600, stale-while-revalidate=14400';

    intlResponse.headers.set('Cache-Control', cacheControl);
    intlResponse.headers.set('CDN-Cache-Control', cacheControl);
    intlResponse.headers.set('Cloudflare-CDN-Cache-Control', cacheControl);
  }

  // For all other routes (including /, /sign-in, /sign-up, /sign-out), just return the intl response
  return intlResponse;
}

export const config = {
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
};
