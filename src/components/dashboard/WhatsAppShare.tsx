'use client';

import { useState } from 'react';
import { MessageCircle, Share2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface WhatsAppShareProps {
  restaurantName: string;
  menuUrl: string;
  phone?: string;
}

export function WhatsAppShare({ restaurantName, menuUrl, phone }: WhatsAppShareProps) {
  const [copied, setCopied] = useState(false);

  const shareText = `🍕 *${restaurantName}* — Cardapio Digital\n\nFaca seu pedido pelo link:\n${menuUrl}\n\nOu pelo WhatsApp!`;

  const whatsappUrl = phone
    ? `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(shareText)}`
    : `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  const copyLink = () => {
    navigator.clipboard.writeText(menuUrl);
    setCopied(true);
    toast.success('Link copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
        <Share2 className="w-5 h-5 text-emerald-600" />
        Divulgar Cardapio
      </h3>
      <p className="text-sm text-gray-500">Compartilhe seu cardapio com clientes no WhatsApp</p>

      <div className="flex gap-2">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#25D366] text-white rounded-xl font-semibold text-sm hover:bg-[#22c55e] transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          Compartilhar no WhatsApp
        </a>
        <button
          onClick={copyLink}
          className="px-4 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
        >
          {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
        </button>
      </div>

      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-xs text-gray-400 mb-1">Link do seu cardapio:</p>
        <code className="text-sm text-emerald-700 font-medium break-all">{menuUrl}</code>
      </div>
    </div>
  );
}
