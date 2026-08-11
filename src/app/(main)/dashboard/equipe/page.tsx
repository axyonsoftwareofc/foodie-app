// src/app/dashboard/equipe/page.tsx (Server Component)
import { getTeamOverview } from '@/actions/team-actions';
import { EquipeClient } from './EquipeClient';

export default async function EquipePage() {
  const result = await getTeamOverview();

  const data = result.data ?? {
    members: [],
    invitations: [],
    auditLogs: [],
    restaurantName: '',
  };

  return <EquipeClient data={data} />;
}
