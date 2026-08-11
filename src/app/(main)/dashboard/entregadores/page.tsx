// src/app/dashboard/entregadores/page.tsx — GESTÃO DE ENTREGADORES (Server Component)
import { getDrivers } from '@/actions/delivery-actions';
import { EntregadoresClient } from './EntregadoresClient';

export default async function EntregadoresPage() {
  const result = await getDrivers();

  return <EntregadoresClient drivers={result.data ?? []} />;
}
