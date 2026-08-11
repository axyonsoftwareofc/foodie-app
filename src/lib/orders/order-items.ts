// src/lib/orders/order-items.ts
//
// Fonte única da verdade para o formato dos itens de um pedido
// (coluna `orders.items`, do tipo Json).
//
// Contexto (auditoria, achado #3): os três caminhos de criação gravavam
// formatos diferentes — cliente/delivery, garçom e mesa/QR — e o leitor
// validava com um schema estrito, descartando silenciosamente os itens dos
// pedidos DINE_IN. Aqui a escrita é normalizada e a leitura é tolerante,
// para que os pedidos já gravados também voltem a exibir seus itens.

import { z } from 'zod';
import type { Prisma } from '@prisma/client';

export type OrderItem = {
  menuItemId: string;
  menuItemName: string;
  menuItemImage: string | null;
  menuItemPrice: number;
  quantity: number;
  observation?: string;
};

/**
 * Schema de LEITURA — tolerante de propósito.
 * Exige apenas o que identifica um item de verdade (nome, preço e quantidade);
 * o resto é opcional e recebe default. `notes` é o nome legado de `observation`,
 * gravado pelo fluxo do garçom.
 */
const storedItemSchema = z.object({
  menuItemId: z.string().optional(),
  menuItemName: z.string().min(1),
  menuItemImage: z.string().nullable().optional(),
  menuItemPrice: z.number().nonnegative(),
  quantity: z.number().int().positive(),
  observation: z.string().optional(),
  notes: z.string().optional(),
});

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

/**
 * Lê os itens de um pedido a partir da coluna Json.
 *
 * Aceita array ou string JSON (algumas gravações antigas usaram
 * `JSON.stringify`). A validação é **por item**: um item corrompido é
 * descartado sem levar junto o resto do pedido.
 */
export function parseOrderItems(raw: unknown): OrderItem[] {
  const parsed = typeof raw === 'string' ? safeJsonParse(raw) : raw;

  if (!Array.isArray(parsed)) {
    return [];
  }

  const items: OrderItem[] = [];

  for (const entry of parsed) {
    const result = storedItemSchema.safeParse(entry);
    if (!result.success) continue;

    const data = result.data;
    const observation = data.observation ?? data.notes;

    items.push({
      menuItemId: data.menuItemId ?? '',
      menuItemName: data.menuItemName,
      menuItemImage: data.menuItemImage ?? null,
      menuItemPrice: data.menuItemPrice,
      quantity: data.quantity,
      ...(observation ? { observation } : {}),
    });
  }

  return items;
}

/**
 * Normaliza os itens para ESCRITA na coluna Json.
 * Todos os caminhos de criação de pedido devem passar por aqui, para que o
 * formato gravado seja sempre o mesmo.
 */
export function toOrderItemsJson(items: OrderItem[]): Prisma.InputJsonValue {
  return items.map((item) => ({
    menuItemId: item.menuItemId,
    menuItemName: item.menuItemName,
    menuItemImage: item.menuItemImage,
    menuItemPrice: item.menuItemPrice,
    quantity: item.quantity,
    ...(item.observation ? { observation: item.observation } : {}),
  })) as unknown as Prisma.InputJsonValue;
}
