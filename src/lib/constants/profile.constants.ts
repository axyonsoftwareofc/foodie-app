// src/lib/constants/profile.constants.ts
export const PROFILE_MESSAGES = {
  PAGE_TITLE: 'Meu Perfil',
  PAGE_SUBTITLE: 'Gerencie suas informações pessoais',
  SAVE_BUTTON: 'Salvar alterações',
  SAVING_BUTTON: 'Salvando...',
  SAVE_SUCCESS: 'Perfil atualizado com sucesso!',
  SAVE_ERROR: 'Erro ao salvar perfil. Tente novamente.',
  LOAD_ERROR: 'Erro ao carregar perfil.',
  SECTION_PERSONAL: 'Informações pessoais',
  SECTION_ACCOUNT: 'Conta',
  LABEL_NAME: 'Nome completo',
  LABEL_EMAIL: 'Email',
  LABEL_PHONE: 'Telefone',
  LABEL_MEMBER_SINCE: 'Membro desde',
  LABEL_AUTH_PROVIDER: 'Login via',
  PLACEHOLDER_NAME: 'Seu nome completo',
  PLACEHOLDER_PHONE: '(11) 99999-9999',
  EMAIL_READONLY_HINT: 'O email não pode ser alterado',
  PHONE_HINT: 'Usado para contato sobre seus pedidos',
} as const;

export const AUTH_PROVIDER_LABELS: Record<string, string> = {
  google: 'Google',
  email: 'Email e senha',
} as const;
