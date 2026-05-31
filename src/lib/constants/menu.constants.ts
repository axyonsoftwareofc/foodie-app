// src/lib/constants/menu.constants.ts
export const MENU_ITEM_CONFIG = {
  minQuantity: 1,
  maxQuantity: 99,
  maxObservationLength: 200,
} as const;

export const MENU_MESSAGES = {
  addToCart: 'Adicionar',
  updateCart: 'Atualizar',
  observation: 'Alguma observação?',
  observationPlaceholder: 'Ex: Tirar cebola, molho à parte...',
  required: 'Obrigatório',
  optional: 'Opcional',
} as const;
