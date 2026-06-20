// src/app/super-admin/users/page.tsx
import { Shield } from 'lucide-react';
import { getAllUsers } from '@/actions/super-admin-actions';
import UsersClient from './users-client';

export default async function UsersPage() {
  const result = await getAllUsers();
  const users = result.data ?? [];

  return (
    <div
      className="p-4 max-w-5xl mx-auto"
      style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh' }}
    >
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>
        <Shield className="inline w-6 h-6 mr-2" />
        Usuários
      </h1>
      <UsersClient initialUsers={users} />
    </div>
  );
}
