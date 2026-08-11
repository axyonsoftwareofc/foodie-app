// src/app/dashboard/mesas/page.tsx (Server Component)
import { getTables } from '@/actions/restaurantActions';
import { MesasClient, type TableData } from './MesasClient';

export default async function MesasPage() {
  const result = await getTables();

  // Normaliza para a forma realmente gravada no banco (number é String e
  // status é o enum em maiúsculas), independente do tipo declarado.
  const tables: TableData[] = (result.data ?? []).map((t) => ({
    id: String(t.id),
    number: String(t.number),
    capacity: Number(t.capacity),
    status: String(t.status),
  }));

  return <MesasClient tables={tables} />;
}
