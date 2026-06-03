// src/app/(profile)/profile/page.tsx
import { getProfileBatch } from '@/actions/profile-batch-actions';
import { ProfileClient } from './profile-client';
import type { UserPrivacySettings } from '@/types/user-profile.types';

export default async function ProfilePage() {
  const batch = await getProfileBatch();

  if (batch.error || !batch.data) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <p style={{ color: 'var(--color-text-secondary)' }}>Erro ao carregar perfil</p>
      </div>
    );
  }

  const { profile: profileData, privacy, favoritesCount } = batch.data;

  return (
    <ProfileClient
      initialProfile={profileData}
      initialPrivacy={privacy ?? ({} as UserPrivacySettings)}
      initialFavoritesCount={favoritesCount}
    />
  );
}
