'use client';

import { useState } from 'react';
import {
  inviteRestaurantMember,
  disableRestaurantMember,
  cancelRestaurantInvitation,
  type TeamMemberView,
  type TeamInvitationView,
  type AuditLogView,
} from '@/actions/team-actions';
import { Users, UserPlus, Mail, Clock, X, Copy, Check, UserX } from 'lucide-react';
import { toast } from 'sonner';

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Proprietário',
  MANAGER: 'Gerente',
  KITCHEN: 'Cozinha',
  WAITER: 'Garçom',
  DRIVER: 'Entregador',
};

const ROLE_COLORS: Record<string, string> = {
  OWNER: 'bg-purple-100 text-purple-700',
  MANAGER: 'bg-blue-100 text-blue-700',
  KITCHEN: 'bg-orange-100 text-orange-700',
  WAITER: 'bg-emerald-100 text-emerald-700',
  DRIVER: 'bg-amber-100 text-amber-700',
};

const ACTION_LABELS: Record<string, string> = {
  'team.invitation.created': 'Convite enviado',
  'team.invitation.accepted': 'Convite aceito',
  'team.invitation.cancelled': 'Convite cancelado',
  'team.member.disabled': 'Membro desativado',
  'waiter.order.created': 'Pedido criado (garçom)',
  'waiter.table.closed': 'Mesa fechada',
};

export type TeamOverviewData = {
  members: TeamMemberView[];
  invitations: TeamInvitationView[];
  auditLogs: AuditLogView[];
  restaurantName: string;
};

export function EquipeClient({ data }: { data: TeamOverviewData }) {
  // Dados do servidor vêm por props — as server actions chamam revalidatePath,
  // então a árvore é re-renderizada com os dados atualizados automaticamente.
  const { members, invitations, auditLogs, restaurantName } = data;

  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('WAITER');
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);

  async function handleInvite() {
    if (!inviteEmail) return;
    setInviting(true);
    const result = await inviteRestaurantMember({
      email: inviteEmail,
      fullName: inviteName || undefined,
      role: inviteRole,
    });
    setInviting(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      setInviteLink(result.data!.invitationLink);
    }
  }

  async function handleDisable(memberId: string) {
    const result = await disableRestaurantMember(memberId);
    if (result.error) toast.error(result.error);
    else {
      toast.success('Membro desativado');
    }
  }

  async function handleCancelInvite(invitationId: string) {
    const result = await cancelRestaurantInvitation(invitationId);
    if (result.error) toast.error(result.error);
    else {
      toast.success('Convite cancelado');
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success('Link copiado!');
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="p-4 max-w-3xl mx-auto space-y-6"
      style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh' }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            <Users className="inline w-6 h-6 mr-2" />
            Equipe
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {restaurantName}
          </p>
        </div>
        <button
          onClick={() => {
            setShowInvite(!showInvite);
            setInviteLink('');
          }}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <UserPlus className="w-4 h-4" />
          Convidar
        </button>
      </div>

      {showInvite && (
        <div
          className="rounded-2xl border p-4 space-y-3"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-card)' }}
        >
          {inviteLink ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-emerald-700">
                Convite criado! Compartilhe o link:
              </p>
              <div className="flex items-center gap-2 rounded-lg border p-2 bg-gray-50">
                <input
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="flex-1 bg-transparent text-xs text-gray-600 outline-none"
                />
                <button
                  onClick={copyLink}
                  className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
              <button
                onClick={() => {
                  setShowInvite(false);
                  setInviteLink('');
                  setInviteEmail('');
                  setInviteName('');
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Novo convite
              </button>
            </div>
          ) : (
            <>
              <div>
                <label
                  className="text-xs font-medium"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="funcionario@email.com"
                  className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: 'var(--color-border)' }}
                />
              </div>
              <div>
                <label
                  className="text-xs font-medium"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Nome (opcional)
                </label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Nome completo"
                  className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: 'var(--color-border)' }}
                />
              </div>
              <div>
                <label
                  className="text-xs font-medium"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Função
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <option value="MANAGER">Gerente</option>
                  <option value="KITCHEN">Cozinha</option>
                  <option value="WAITER">Garçom</option>
                  <option value="DRIVER">Entregador</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleInvite}
                  disabled={inviting || !inviteEmail}
                  className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {inviting ? 'Enviando...' : 'Gerar convite'}
                </button>
                <button
                  onClick={() => setShowInvite(false)}
                  className="rounded-xl border px-4 py-2.5 text-sm text-gray-600"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  Cancelar
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
          Membros ({members.length})
        </h2>
        <div className="space-y-2">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-3 rounded-xl border p-3"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-bg-card)',
              }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-bold">
                {(m.fullName || m.email)[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>
                  {m.fullName || m.email}
                </p>
                <p className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>
                  {m.email}
                </p>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[m.role] || 'bg-gray-100 text-gray-600'}`}
              >
                {ROLE_LABELS[m.role] || m.role}
              </span>
              {m.status === 'INVITED' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">
                  Pendente
                </span>
              )}
              {m.role !== 'OWNER' && (
                <button
                  onClick={() => handleDisable(m.id)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  title="Desativar"
                >
                  <UserX className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          {members.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">Nenhum membro na equipe</p>
          )}
        </div>
      </div>

      {invitations.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
            Convites Pendentes ({invitations.length})
          </h2>
          <div className="space-y-2">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center gap-3 rounded-xl border p-3"
                style={{
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'var(--color-bg-card)',
                }}
              >
                <Mail className="w-5 h-5 text-yellow-500" />
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: 'var(--color-text)' }}
                  >
                    {inv.fullName || inv.email}
                  </p>
                  <p
                    className="text-xs flex items-center gap-1"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {inv.email} · {ROLE_LABELS[inv.role] || inv.role} ·{' '}
                    <Clock className="w-3 h-3" />{' '}
                    {new Date(inv.expiresAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <button
                  onClick={() => handleCancelInvite(inv.id)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
          Atividade Recente
        </h2>
        <div className="space-y-1">
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <span className="text-xs">{ACTION_LABELS[log.action] || log.action}</span>
              <span className="text-xs opacity-50 ml-auto">
                {new Date(log.createdAt).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          ))}
          {auditLogs.length === 0 && (
            <p className="text-sm text-gray-400 py-2">Nenhuma atividade registrada</p>
          )}
        </div>
      </div>
    </div>
  );
}
