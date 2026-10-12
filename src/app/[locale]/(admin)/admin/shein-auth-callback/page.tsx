import { setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import { SheinAuthCallbackClient } from './page-client';

export default async function SheinAuthCallbackPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Suspense fallback={<div>加载中...</div>}>
      <SheinAuthCallbackClient />
    </Suspense>
  );
}
