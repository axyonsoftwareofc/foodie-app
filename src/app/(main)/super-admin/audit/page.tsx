// src/app/super-admin/audit/page.tsx
import { getGlobalAuditLog } from '@/actions/super-admin-actions';
import AuditClient from './audit-client';

export default async function AuditPage() {
  const result = await getGlobalAuditLog(1);
  const data = result.data;

  return (
    <div
      className="p-4 max-w-5xl mx-auto"
      style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh' }}
    >
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>
        Auditoria
      </h1>
      <AuditClient initialItems={data?.items ?? []} initialTotal={data?.total ?? 0} />
    </div>
  );
}
