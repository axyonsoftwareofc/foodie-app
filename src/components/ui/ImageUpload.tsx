'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Upload, Loader2, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  hint?: string;
}

export default function ImageUpload({
  value,
  onChange,
  folder = 'foodie',
  label = 'Imagem',
  hint,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        toast.error('Apenas imagens são permitidas');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Imagem muito grande (máximo 5MB)');
        return;
      }

      const localPreview = URL.createObjectURL(file);
      setPreview(localPreview);
      setIsUploading(true);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);

        const { uploadRestaurantImage } = await import('@/actions/upload-actions');
        const result = await uploadRestaurantImage(formData);

        if (result.url) {
          onChange(result.url);
          setPreview(result.url);
        } else if (result.error) {
          toast.error(result.error);
          setPreview(value || null);
        }
      } catch {
        toast.error('Erro ao fazer upload da imagem');
        setPreview(value || null);
      }

      setIsUploading(false);
    },
    [folder, onChange, value]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onChange('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {hint && <span className="text-xs text-gray-400">{hint}</span>}
      </div>

      {preview ? (
        <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 group">
          <Image src={preview} alt={label} fill className="object-cover" sizes="96px" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="p-1.5 bg-white rounded-lg text-gray-700 hover:bg-gray-100"
              title="Trocar imagem"
            >
              <Upload className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 bg-white rounded-lg text-red-600 hover:bg-red-50"
              title="Remover"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {isUploading && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-white" />
            </div>
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`w-24 h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors ${
            dragOver
              ? 'border-emerald-500 bg-emerald-50'
              : 'border-gray-300 hover:border-emerald-400 hover:bg-gray-50'
          }`}
        >
          {isUploading ? (
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          ) : (
            <>
              <ImageIcon className="w-6 h-6 text-gray-400" />
              <span className="text-[10px] text-gray-400 mt-1">Upload</span>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
