'use client';

import { MessageCircle } from 'lucide-react';

interface WhatsAppButtonProps {
  phone: string;
  message?: string;
}

export function WhatsAppButton({ phone, message }: WhatsAppButtonProps) {
  if (!phone) return null;

  const cleanPhone = phone.replace(/\D/g, '');
  const text = message || 'Ola! Gostaria de fazer um pedido.';
  const url = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(text)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] rounded-full shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center group"
      aria-label="Pedir pelo WhatsApp"
    >
      <MessageCircle className="w-7 h-7 text-white" />
      <span className="absolute right-full mr-3 bg-white text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Pedir pelo WhatsApp
      </span>
    </a>
  );
}
