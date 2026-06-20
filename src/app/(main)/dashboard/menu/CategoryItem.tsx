'use client';

import { useState, useRef } from 'react';
import {
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductAvailability,
} from '@/actions/productActions';
import { GripVertical, Plus, X, Loader2, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import { toast } from 'sonner';

function SubmitProductButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-70 flex items-center justify-center min-w-[100px]"
    >
      {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
    </button>
  );
}

type CategoryProduct = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  isAvailable?: boolean;
};

type CategoryWithProducts = {
  id: string;
  name: string;
  products?: CategoryProduct[];
};

export function CategoryItem({ category }: { category: CategoryWithProducts }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleAddProduct(formData: FormData) {
    formData.append('categoryId', category.id);
    await createProduct(formData);
    setIsAdding(false);
    formRef.current?.reset();
  }

  function startEdit(product: CategoryProduct) {
    setEditingId(product.id);
    setEditName(product.name);
    setEditPrice(product.price.toFixed(2).replace('.', '.'));
    setEditDesc(product.description || '');
  }

  async function handleSaveEdit(productId: string) {
    setIsSaving(true);
    const formData = new FormData();
    formData.append('name', editName);
    formData.append('price', editPrice);
    formData.append('description', editDesc);
    formData.append('categoryId', category.id);

    const result = await updateProduct(productId, formData);
    if (result.success) {
      toast.success('Produto atualizado!');
      setEditingId(null);
    } else {
      toast.error(result.error || 'Erro ao atualizar');
    }
    setIsSaving(false);
  }

  async function handleDelete(productId: string, productName: string) {
    if (!confirm(`Excluir "${productName}"? Esta acao nao pode ser desfeita.`)) return;

    const result = await deleteProduct(productId);
    if (result.success) {
      toast.success('Produto excluido!');
    } else {
      toast.error(result.error || 'Erro ao excluir');
    }
  }

  async function handleToggle(productId: string, currentAvailable?: boolean) {
    const result = await toggleProductAvailability(productId, !currentAvailable);
    if (result.success) {
      toast.success(currentAvailable ? 'Produto indisponivel' : 'Produto disponivel');
    } else {
      toast.error(result.error || 'Erro');
    }
  }

  return (
    <li className="border-b border-gray-100 last:border-0 bg-white">
      <div className="p-4 flex items-center justify-between hover:bg-gray-50 group transition-colors">
        <div className="flex items-center gap-3">
          <GripVertical className="w-5 h-5 text-gray-300 cursor-grab" />
          <span className="font-bold text-gray-800 text-lg">{category.name}</span>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="text-sm text-emerald-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-md hover:bg-emerald-100"
        >
          {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isAdding ? 'Cancelar' : 'Adicionar Produto'}
        </button>
      </div>

      {category.products && category.products.length > 0 && (
        <div className="px-12 pb-4 space-y-2">
          {category.products.map((product) => (
            <div
              key={product.id}
              className={`flex justify-between items-start p-3 rounded-lg border ${product.isAvailable === false ? 'bg-red-50 border-red-200 opacity-60' : 'bg-gray-50 border-gray-100'}`}
            >
              {editingId === product.id ? (
                <div className="flex-1 space-y-2 mr-3">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="Preco"
                    />
                    <input
                      type="text"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="Descricao"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(product.id)}
                      disabled={isSaving}
                      className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-medium"
                    >
                      {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Salvar'}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1 bg-gray-200 text-gray-600 rounded text-xs"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 min-w-0 mr-2">
                    <h4
                      className={`font-medium ${product.isAvailable === false ? 'text-gray-400 line-through' : 'text-gray-900'}`}
                    >
                      {product.name}
                    </h4>
                    {product.description && (
                      <p className="text-sm text-gray-500 truncate">{product.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="font-semibold text-gray-900 bg-white px-2 py-1 rounded border border-gray-200 text-sm mr-1">
                      R$ {product.price.toFixed(2).replace('.', ',')}
                    </span>
                    <button
                      onClick={() => handleToggle(product.id, product.isAvailable ?? true)}
                      title={
                        product.isAvailable === false ? 'Marcar disponivel' : 'Marcar indisponivel'
                      }
                      className="p-1 rounded hover:bg-gray-200 transition-colors"
                    >
                      {product.isAvailable === false ? (
                        <EyeOff className="w-4 h-4 text-red-500" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={() => startEdit(product)}
                      title="Editar"
                      className="p-1 rounded hover:bg-gray-200 transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id, product.name)}
                      title="Excluir"
                      className="p-1 rounded hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {isAdding && (
        <div className="px-12 pb-4">
          <form
            ref={formRef}
            action={handleAddProduct}
            className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4"
          >
            <h4 className="font-medium text-gray-900 text-sm mb-2">
              Novo Produto em {category.name}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="name"
                required
                placeholder="Nome do produto (ex: X-Bacon)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <input
                type="text"
                name="price"
                required
                placeholder="Preco (ex: 29,90)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <textarea
              name="description"
              placeholder="Descricao (ex: Pao brioche, blend 160g, queijo prato, bacon crocante)"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
            />
            <div className="flex justify-end">
              <SubmitProductButton />
            </div>
          </form>
        </div>
      )}
    </li>
  );
}
