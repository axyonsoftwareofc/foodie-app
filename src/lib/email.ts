import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[Email] SMTP_USER ou SMTP_PASS nao configurados.');
    }
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; error?: string }> {
  const transport = getTransporter();
  if (!transport) {
    return { success: false, error: 'Email nao configurado' };
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  try {
    await transport.sendMail({
      from: `"Foodie App" <${from}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    return { success: true };
  } catch (error) {
    console.error('[Email] Erro ao enviar:', error);
    return { success: false, error: 'Erro ao enviar email' };
  }
}

const baseTemplate = (title: string, content: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #f9fafb; padding: 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="background: #00A082; padding: 24px; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 20px;">Foodie App</h1>
    </div>
    <div style="padding: 24px;">
      <h2 style="color: #111; font-size: 18px; margin-top: 0;">${title}</h2>
      ${content}
    </div>
    <div style="background: #f3f4f6; padding: 16px; text-align: center;">
      <p style="color: #9ca3af; font-size: 11px; margin: 0;">
        Foodie App — Plataforma de delivery
      </p>
    </div>
  </div>
</body>
</html>
`;

export function orderConfirmationTemplate(
  orderId: string,
  restaurantName: string,
  total: number,
  items: { name: string; quantity: number }[]
): string {
  const itemList = items
    .map((i) => `<li style="margin-bottom: 4px;">${i.quantity}x ${i.name}</li>`)
    .join('');

  return baseTemplate(
    'Pedido Confirmado! 🎉',
    `
      <p style="color: #374151;">Seu pedido no <strong>${restaurantName}</strong> foi recebido e esta sendo preparado.</p>
      <div style="background: #f3f4f6; border-radius: 8px; padding: 12px; margin: 16px 0;">
        <p style="font-size: 12px; color: #6b7280; margin: 0 0 8px;">PEDIDO #${orderId.slice(-8).toUpperCase()}</p>
        <ul style="margin: 0; padding-left: 16px; font-size: 14px; color: #374151;">${itemList}</ul>
        <p style="font-size: 16px; font-weight: bold; color: #00A082; margin: 12px 0 0; text-align: right;">
          Total: R$ ${total.toFixed(2).replace('.', ',')}
        </p>
      </div>
      <p style="color: #6b7280; font-size: 13px;">Acompanhe seu pedido em tempo real pelo link abaixo:</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/orders/${orderId}" style="display: inline-block; background: #00A082; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: bold; margin-top: 8px;">
        Ver Pedido
      </a>
    `
  );
}

export function orderStatusTemplate(
  orderId: string,
  restaurantName: string,
  status: string,
  statusLabel: string
): string {
  const statusEmojis: Record<string, string> = {
    CONFIRMED: '✅',
    PREPARING: '👨‍🍳',
    READY: '📦',
    DELIVERING: '🛵',
    DELIVERED: '🎉',
    CANCELLED: '❌',
  };

  return baseTemplate(
    `Atualizacao do Pedido ${statusEmojis[status] || ''}`,
    `
      <p style="color: #374151;">Seu pedido no <strong>${restaurantName}</strong> foi atualizado:</p>
      <div style="background: #d1fae5; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center;">
        <p style="font-size: 18px; font-weight: bold; color: #059669; margin: 0;">${statusLabel}</p>
        <p style="font-size: 12px; color: #6b7280; margin: 4px 0 0;">Pedido #${orderId.slice(-8).toUpperCase()}</p>
      </div>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/orders/${orderId}" style="display: inline-block; background: #00A082; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: bold;">
        Acompanhar Pedido
      </a>
    `
  );
}
