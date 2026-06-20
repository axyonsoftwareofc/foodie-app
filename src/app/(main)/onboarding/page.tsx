'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import {
  tenantStep1Schema,
  CATEGORY_OPTIONS,
  type TenantStep1Data,
} from '@/lib/validations/tenant.validations';
import { cn } from '@/lib/utils/cn';

function getStep1Data(): TenantStep1Data {
  if (typeof window === 'undefined') {
    return { name: '', category: '', phone: '', email: '', description: '' };
  }
  try {
    const raw = sessionStorage.getItem('onboarding_step1');
    return raw
      ? JSON.parse(raw)
      : { name: '', category: '', phone: '', email: '', description: '' };
  } catch {
    return { name: '', category: '', phone: '', email: '', description: '' };
  }
}

export default function OnboardingStep1() {
  const router = useRouter();
  const [form, setForm] = useState<TenantStep1Data>(getStep1Data);
  const [errors, setErrors] = useState<Partial<Record<keyof TenantStep1Data, string>>>({});
  const [cnpjRaw, setCnpjRaw] = useState('');

  const formatCnpj = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    let formatted = digits;
    if (digits.length > 2) formatted = digits.slice(0, 2) + '.' + digits.slice(2);
    if (digits.length > 5) formatted = formatted.slice(0, 6) + '.' + formatted.slice(6);
    if (digits.length > 8) formatted = formatted.slice(0, 10) + '/' + formatted.slice(10);
    if (digits.length > 12) formatted = formatted.slice(0, 15) + '-' + formatted.slice(15);
    return formatted;
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const updateField = (field: keyof TenantStep1Data, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleNext = () => {
    const data = { ...form, cnpj: cnpjRaw ? formatCnpj(cnpjRaw) : undefined };
    const result = tenantStep1Schema.safeParse(data);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof TenantStep1Data, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof TenantStep1Data;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      toast.error('Verifique os campos obrigatorios');
      return;
    }

    sessionStorage.setItem('onboarding_step1', JSON.stringify(result.data));
    router.push('/onboarding/domain');
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Criar meu restaurante</h1>
        <p className="text-gray-500 mt-1">Conte um pouco sobre o seu negocio</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome do restaurante <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="Ex: Pizzaria do Ze"
            className={cn(
              'w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900',
              errors.name ? 'border-red-300' : 'border-gray-300'
            )}
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Categoria <span className="text-red-500">*</span>
          </label>
          <select
            value={form.category}
            onChange={(e) => updateField('category', e.target.value)}
            className={cn(
              'w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 bg-white',
              errors.category ? 'border-red-300' : 'border-gray-300'
            )}
          >
            <option value="">Selecione...</option>
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
          <input
            type="text"
            value={cnpjRaw}
            onChange={(e) => {
              const formatted = formatCnpj(e.target.value);
              setCnpjRaw(formatted);
              updateField('cnpj', formatted);
            }}
            placeholder="00.000.000/0000-00"
            maxLength={18}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Telefone / WhatsApp <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.phone}
            onChange={(e) => updateField('phone', formatPhone(e.target.value))}
            placeholder="(11) 99999-9999"
            maxLength={15}
            className={cn(
              'w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900',
              errors.phone ? 'border-red-300' : 'border-gray-300'
            )}
          />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email de contato</label>
          <input
            type="email"
            value={form.email || ''}
            onChange={(e) => updateField('email', e.target.value)}
            placeholder="contato@pizzariadoze.com.br"
            className={cn(
              'w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900',
              errors.email ? 'border-red-300' : 'border-gray-300'
            )}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descricao curta</label>
          <textarea
            value={form.description || ''}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="A melhor pizza da cidade, feita no forno a lenha..."
            rows={2}
            maxLength={200}
            className={cn(
              'w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 resize-none',
              errors.description ? 'border-red-300' : 'border-gray-300'
            )}
          />
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleNext}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
        >
          Proximo
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
