// src/lib/constants/address.constants.ts
export const ADDRESS_MESSAGES = {
  PAGE_TITLE: 'Meus Endereços',
  PAGE_SUBTITLE: 'Gerencie seus endereços de entrega',
  ADD_BUTTON: 'Adicionar endereço',
  SAVE_BUTTON: 'Salvar endereço',
  SAVING_BUTTON: 'Salvando...',
  UPDATE_BUTTON: 'Atualizar endereço',
  UPDATING_BUTTON: 'Atualizando...',
  DELETE_CONFIRM: 'Tem certeza que deseja excluir este endereço?',
  SAVE_SUCCESS: 'Endereço salvo com sucesso!',
  UPDATE_SUCCESS: 'Endereço atualizado com sucesso!',
  DELETE_SUCCESS: 'Endereço excluído com sucesso!',
  DEFAULT_SUCCESS: 'Endereço padrão atualizado!',
  SAVE_ERROR: 'Erro ao salvar endereço. Tente novamente.',
  DELETE_ERROR: 'Erro ao excluir endereço. Tente novamente.',
  LOAD_ERROR: 'Erro ao carregar endereços.',
  EMPTY_TITLE: 'Nenhum endereço cadastrado',
  EMPTY_SUBTITLE: 'Adicione um endereço para facilitar seus pedidos',
  LABEL_DEFAULT: 'Padrão',
  SET_DEFAULT: 'Definir como padrão',
  MODAL_ADD_TITLE: 'Novo endereço',
  MODAL_EDIT_TITLE: 'Editar endereço',
} as const;

export const ADDRESS_LABELS: { value: string; label: string; icon: string }[] = [
  { value: 'Casa', label: 'Casa', icon: '🏠' },
  { value: 'Trabalho', label: 'Trabalho', icon: '🏢' },
  { value: 'Outro', label: 'Outro', icon: '📍' },
];
