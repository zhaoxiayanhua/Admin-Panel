import { redirect } from '@/core/i18n/navigation';

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Redirect to SHEIN pending pickup page
  redirect({ href: '/admin/shein-pending-pickup', locale });
}
