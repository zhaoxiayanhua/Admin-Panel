import { redirect } from '@/core/i18n/navigation';

export default async function RootPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Redirect directly to admin panel
  redirect({ href: '/admin', locale });
}
