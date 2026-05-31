// src/lib/utils/address.utils.ts
/**
 * Formata CEP para exibição: 01234-567
 */
export function formatZipCodeInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);

  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/**
 * Formata endereço completo em uma linha
 */
export function formatFullAddress(address: {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}): string {
  const parts = [
    `${address.street}, ${address.number}`,
    address.complement,
    address.neighborhood,
    `${address.city} - ${address.state}`,
  ];

  return parts.filter(Boolean).join(', ');
}

/**
 * Busca endereço pelo CEP usando a API ViaCEP (gratuita)
 */
export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export async function fetchAddressByCep(
  cep: string
): Promise<{ data?: ViaCepResponse; error?: string }> {
  const digits = cep.replace(/\D/g, '');

  if (digits.length !== 8) {
    return { error: 'CEP deve ter 8 dígitos' };
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    const data: ViaCepResponse = await response.json();

    if (data.erro) {
      return { error: 'CEP não encontrado' };
    }

    return { data };
  } catch {
    return { error: 'Erro ao buscar CEP. Verifique sua conexão.' };
  }
}
