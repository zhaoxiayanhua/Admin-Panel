import { setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import { SheinAuthPageClient } from './page-client';

export default async function SheinAuthPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<div>加载中...</div>}>
        <SheinAuthPageClient />
      </Suspense>
    </div>
  );
}
