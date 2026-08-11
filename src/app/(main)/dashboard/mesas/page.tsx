// src/app/dashboard/mesas/page.tsx (Server Component)
import { getTables } from '@/actions/restaurantActions';
import { MesasClient, type TableData } from './MesasClient';

export default async function MesasPage() {
  const result = await getTables();

  const tables: TableData[] = (result.data ?? []).map((t) => ({
    id: t.id,
    number: t.number,
    capacity: t.capacity,
    status: t.status,
  }));

  return <MesasClient tables={tables} />;
}
