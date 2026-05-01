// lib/whatsapp.ts
// Utility to build WhatsApp pre-filled message URLs for order confirmation

interface WhatsAppOrderParams {
  buyerPhone?: string;
  buyerName: string;
  orderNumber: string;
  orderItems: { name: string; quantity: number; price: number }[];
  total: number;
  storeWhatsAppNumber: string;
  storeName: string;
}

/**
 * Constructs a pre-filled WhatsApp message URL.
 * 
 * IMPORTANT: This approach opens WhatsApp on the buyer's device for them to send manually.
 * It does NOT send programmatically from the server. Full programmatic sending
 * requires the official WhatsApp Business API or third-party providers.
 */
export function sendWhatsAppOrderConfirmation({
  buyerName,
  orderNumber,
  orderItems,
  total,
  storeWhatsAppNumber,
  storeName
}: WhatsAppOrderParams): string {
  const cleanNumber = storeWhatsAppNumber.replace(/\+/g, '').replace(/\s/g, '');
  
  const itemSummary = orderItems
    .map(item => `- ${item.name} (x${item.quantity})`)
    .join('\n');

  const message = `Hi ${storeName},

I just placed order #${orderNumber}!

*Order Details:*
${itemSummary}

*Total:* KES ${total.toLocaleString()}

My name is ${buyerName}. Looking forward to receiving my items!`;

  const encodedMessage = encodeURIComponent(message);
  
  return `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
}
