'use server';

import { v2 as cloudinary } from 'cloudinary';
import { getCurrentUser } from '@/lib/authz';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

interface UploadResult {
  url?: string;
  error?: string;
}

export async function uploadRestaurantImage(formData: FormData): Promise<UploadResult> {
  const { user, error: authError } = await getCurrentUser();
  if (authError || !user) return { error: 'Usuario nao autenticado' };

  if (!process.env.CLOUDINARY_API_KEY) {
    return { error: 'Cloudinary nao configurado' };
  }

  const file = formData.get('file') as File | null;
  const userFolder = (formData.get('folder') as string) || 'foodie';
  const folder = `foodie/${userFolder.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/\.\./g, '')}`;

  if (!file || !(file instanceof File)) {
    return { error: 'Nenhum arquivo enviado' };
  }

  if (!file.type.startsWith('image/')) {
    return { error: 'Apenas imagens sao permitidas' };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { error: 'Imagem muito grande (max 5MB)' };
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

    const result = await cloudinary.uploader.upload(base64, {
      folder,
      resource_type: 'image',
      transformation: [
        { width: 800, height: 800, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
      ],
    });

    return { url: result.secure_url };
  } catch (error) {
    console.error('[Cloudinary] Upload error:', error);
    return { error: 'Erro ao fazer upload da imagem' };
  }
}
