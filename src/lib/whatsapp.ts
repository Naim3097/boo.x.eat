// =============================================
// WHATSAPP INTEGRATION
// WhatsApp Business API integration for boo.x.eat
// =============================================

// WhatsApp message templates
export const WHATSAPP_TEMPLATES = {
  BOOKING_CONFIRMATION: 'booking_confirmation',
  BOOKING_REMINDER: 'booking_reminder',
  BOOKING_CANCELLED: 'booking_cancelled',
} as const;

export type WhatsAppTemplate = typeof WHATSAPP_TEMPLATES[keyof typeof WHATSAPP_TEMPLATES];

// Booking data for WhatsApp messages
export interface WhatsAppBookingData {
  customerName: string;
  customerPhone: string;
  vendorName: string;
  vendorPhone?: string;
  bookingReference: string;
  bookingDate: string;
  bookingTime: string;
  partySize: number;
  packageName?: string;
  totalAmount?: number;
}

// Format phone number for WhatsApp (Malaysia format)
export const formatPhoneForWhatsApp = (phone: string): string => {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Handle Malaysian numbers
  if (cleaned.startsWith('0')) {
    cleaned = '60' + cleaned.substring(1);
  } else if (!cleaned.startsWith('60') && cleaned.length >= 9) {
    // Assume Malaysian if no country code
    cleaned = '60' + cleaned;
  }
  
  return cleaned;
};

// Generate WhatsApp click-to-chat URL
export const generateWhatsAppUrl = (phone: string, message: string): string => {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
};

// Generate booking confirmation message
export const generateConfirmationMessage = (data: WhatsAppBookingData): string => {
  let message = `🍽️ *Booking Confirmed!*\n\n`;
  message += `Hi ${data.customerName},\n\n`;
  message += `Your booking at *${data.vendorName}* is confirmed!\n\n`;
  message += `📋 *Booking Details:*\n`;
  message += `• Reference: ${data.bookingReference}\n`;
  message += `• Date: ${data.bookingDate}\n`;
  message += `• Time: ${data.bookingTime}\n`;
  message += `• Party Size: ${data.partySize} pax\n`;
  
  if (data.packageName) {
    message += `• Package: ${data.packageName}\n`;
  }
  
  if (data.totalAmount) {
    message += `• Total: RM ${data.totalAmount.toFixed(2)}\n`;
  }
  
  message += `\n📍 Please arrive 10 minutes early.\n`;
  message += `\nThank you for your booking! 🙏`;
  
  return message;
};

// Generate reminder message
export const generateReminderMessage = (data: WhatsAppBookingData): string => {
  let message = `⏰ *Booking Reminder*\n\n`;
  message += `Hi ${data.customerName},\n\n`;
  message += `This is a reminder for your booking tomorrow at *${data.vendorName}*.\n\n`;
  message += `📋 *Details:*\n`;
  message += `• Date: ${data.bookingDate}\n`;
  message += `• Time: ${data.bookingTime}\n`;
  message += `• Party Size: ${data.partySize} pax\n`;
  message += `• Ref: ${data.bookingReference}\n\n`;
  message += `See you soon! 👋`;
  
  return message;
};

// Generate cancellation message
export const generateCancellationMessage = (data: WhatsAppBookingData): string => {
  let message = `❌ *Booking Cancelled*\n\n`;
  message += `Hi ${data.customerName},\n\n`;
  message += `Your booking at *${data.vendorName}* has been cancelled.\n\n`;
  message += `📋 *Details:*\n`;
  message += `• Reference: ${data.bookingReference}\n`;
  message += `• Date: ${data.bookingDate}\n`;
  message += `• Time: ${data.bookingTime}\n\n`;
  message += `We hope to see you again soon!`;
  
  return message;
};

// Generate vendor notification message
export const generateVendorNotificationMessage = (data: WhatsAppBookingData): string => {
  let message = `🎉 *New Booking!*\n\n`;
  message += `*Customer:* ${data.customerName}\n`;
  message += `*Phone:* ${data.customerPhone}\n`;
  message += `*Date:* ${data.bookingDate}\n`;
  message += `*Time:* ${data.bookingTime}\n`;
  message += `*Party Size:* ${data.partySize} pax\n`;
  message += `*Ref:* ${data.bookingReference}\n`;
  
  if (data.packageName) {
    message += `*Package:* ${data.packageName}\n`;
  }
  
  if (data.totalAmount) {
    message += `*Total:* RM ${data.totalAmount.toFixed(2)}\n`;
  }
  
  return message;
};

// Open WhatsApp with pre-filled message (for customer contact)
export const openWhatsAppChat = (phone: string, message: string): void => {
  const url = generateWhatsAppUrl(phone, message);
  window.open(url, '_blank');
};

// Send booking confirmation via WhatsApp (opens WhatsApp)
export const sendWhatsAppConfirmation = (data: WhatsAppBookingData): void => {
  const message = generateConfirmationMessage(data);
  openWhatsAppChat(data.customerPhone, message);
};

// Send reminder via WhatsApp (opens WhatsApp)
export const sendWhatsAppReminder = (data: WhatsAppBookingData): void => {
  const message = generateReminderMessage(data);
  openWhatsAppChat(data.customerPhone, message);
};

// WhatsApp Business API integration (for automated messages)
// Requires WhatsApp Business API account
export interface WhatsAppAPIConfig {
  accessToken: string;
  phoneNumberId: string;
  businessAccountId: string;
}

// Send message via WhatsApp Business API
export const sendWhatsAppAPIMessage = async (
  config: WhatsAppAPIConfig,
  to: string,
  template: WhatsAppTemplate,
  parameters: string[]
): Promise<{ success: boolean; error?: string }> => {
  try {
    const formattedPhone = formatPhoneForWhatsApp(to);
    
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${config.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'template',
          template: {
            name: template,
            language: { code: 'en' },
            components: [
              {
                type: 'body',
                parameters: parameters.map(text => ({ type: 'text', text })),
              },
            ],
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('WhatsApp API error:', data);
      return { success: false, error: data.error?.message || 'Failed to send message' };
    }

    return { success: true };
  } catch (error) {
    console.error('WhatsApp API exception:', error);
    return { success: false, error: 'Failed to send WhatsApp message' };
  }
};

// WhatsApp share button component helper
export interface WhatsAppShareProps {
  vendorName: string;
  vendorSlug: string;
  message?: string;
}

export const generateShareUrl = ({ vendorName, vendorSlug, message }: WhatsAppShareProps): string => {
  const baseUrl = window.location.origin;
  const bookingUrl = `${baseUrl}/${vendorSlug}`;
  const defaultMessage = message || `Check out ${vendorName} for your next event! Book now: ${bookingUrl}`;
  return `https://wa.me/?text=${encodeURIComponent(defaultMessage)}`;
};
