// src/tests/unit/orders/order-items.test.ts
// Achado #3: os três caminhos de criação de pedido gravavam formatos diferentes
// e o leitor estrito descartava os itens de pedidos DINE_IN (garçom e mesa/QR).
import { describe, it, expect } from 'vitest';
import { parseOrderItems, toOrderItemsJson } from '@/lib/orders/order-items';

// Formatos reais gravados hoje no banco, por origem.
const FORMATO_CLIENTE = [
  {
    menuItemId: 'prod-1',
    menuItemName: 'Pizza Calabresa',
    menuItemImage: null,
    menuItemPrice: 45.9,
    quantity: 2,
    observation: 'sem cebola',
  },
];

const FORMATO_GARCOM = [
  { menuItemName: 'Pizza Calabresa', quantity: 2, menuItemPrice: 45.9, notes: 'sem cebola' },
];

const FORMATO_MESA_QR = [{ menuItemName: 'Pizza Calabresa', quantity: 2, menuItemPrice: 45.9 }];

describe('parseOrderItems — tolerante aos formatos legados', () => {
  it('preserva o formato do cliente (delivery)', () => {
    const items = parseOrderItems(FORMATO_CLIENTE);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      menuItemId: 'prod-1',
      menuItemName: 'Pizza Calabresa',
      menuItemPrice: 45.9,
      quantity: 2,
      observation: 'sem cebola',
    });
  });

  it('recupera itens do garçom (sem menuItemId/menuItemImage, com "notes")', () => {
    const items = parseOrderItems(FORMATO_GARCOM);

    expect(items).toHaveLength(1);
    expect(items[0].menuItemName).toBe('Pizza Calabresa');
    expect(items[0].quantity).toBe(2);
    expect(items[0].menuItemPrice).toBe(45.9);
    // "notes" é o nome legado de "observation"
    expect(items[0].observation).toBe('sem cebola');
    expect(items[0].menuItemImage).toBeNull();
  });

  it('recupera itens da mesa/QR (apenas nome, preço e quantidade)', () => {
    const items = parseOrderItems(FORMATO_MESA_QR);

    expect(items).toHaveLength(1);
    expect(items[0].menuItemName).toBe('Pizza Calabresa');
    expect(items[0].quantity).toBe(2);
  });

  it('aceita string JSON (coluna gravada com dupla codificação)', () => {
    const items = parseOrderItems(JSON.stringify(FORMATO_GARCOM));

    expect(items).toHaveLength(1);
    expect(items[0].menuItemName).toBe('Pizza Calabresa');
  });

  it('descarta apenas o item inválido, preservando os demais', () => {
    const items = parseOrderItems([
      ...FORMATO_MESA_QR,
      { menuItemName: '', quantity: 0 }, // inválido
      { menuItemName: 'Refrigerante', quantity: 1, menuItemPrice: 8 },
    ]);

    expect(items).toHaveLength(2);
    expect(items.map((i) => i.menuItemName)).toEqual(['Pizza Calabresa', 'Refrigerante']);
  });

  it('retorna lista vazia para entradas sem sentido', () => {
    expect(parseOrderItems(null)).toEqual([]);
    expect(parseOrderItems(undefined)).toEqual([]);
    expect(parseOrderItems('nao é json')).toEqual([]);
    expect(parseOrderItems({ foo: 'bar' })).toEqual([]);
  });
});

describe('toOrderItemsJson — normaliza na escrita', () => {
  it('grava o formato canônico a partir de itens parciais', () => {
    const json = toOrderItemsJson([
      {
        menuItemId: 'prod-9',
        menuItemName: 'Suco',
        menuItemImage: null,
        menuItemPrice: 10,
        quantity: 1,
      },
    ]);

    expect(json).toEqual([
      {
        menuItemId: 'prod-9',
        menuItemName: 'Suco',
        menuItemImage: null,
        menuItemPrice: 10,
        quantity: 1,
      },
    ]);
  });

  it('ida e volta: o que é gravado é lido de volta igual', () => {
    const original = parseOrderItems(FORMATO_GARCOM);
    const roundTrip = parseOrderItems(toOrderItemsJson(original));

    expect(roundTrip).toEqual(original);
  });
});
