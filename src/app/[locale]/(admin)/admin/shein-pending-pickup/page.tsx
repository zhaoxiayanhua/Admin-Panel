import { setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import { SheinPendingPickupPageClient } from './page-client';

export default async function SheinPendingPickupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<div>加载中...</div>}>
        <SheinPendingPickupPageClient />
      </Suspense>
    </div>
  );
}
