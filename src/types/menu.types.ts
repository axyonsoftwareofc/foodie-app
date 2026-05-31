// src/types/menu.types.ts
import { MenuItem } from './index';

export interface MenuItemModalProps {
  item: MenuItem;
  isOpen: boolean;
  onClose: () => void;
  initialQuantity?: number;
  initialObservation?: string;
  mode?: 'add' | 'edit';
}

export interface MenuItemSelection {
  item: MenuItem;
  quantity: number;
  observation?: string;
}
