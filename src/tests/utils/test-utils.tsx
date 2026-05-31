// src/tests/utils/test-utils.tsx
import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartProvider } from '../../contexts/CartContext';

interface ProvidersProps {
  children: ReactNode;
}

function AllProviders({ children }: ProvidersProps): React.JSX.Element {
  return <CartProvider>{children}</CartProvider>;
}

function customRender(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: AllProviders, ...options }),
  };
}

export * from '@testing-library/react';
export { customRender as render, userEvent };
