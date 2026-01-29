// =============================================
// EMAIL NOTIFICATION SERVICE
// Email templates and sending for boo.x.eat
// =============================================

import { supabase } from './supabase';

// Email templates
export const EMAIL_TEMPLATES = {
  BOOKING_CONFIRMATION: 'booking_confirmation',
  BOOKING_REMINDER: 'booking_reminder',
  BOOKING_CANCELLED: 'booking_cancelled',
  BOOKING_UPDATED: 'booking_updated',
  VENDOR_NEW_BOOKING: 'vendor_new_booking',
  VENDOR_BOOKING_CANCELLED: 'vendor_booking_cancelled',
} as const;

export type EmailTemplate = typeof EMAIL_TEMPLATES[keyof typeof EMAIL_TEMPLATES];

// Booking data for emails
export interface BookingEmailData {
  bookingId: string;
  bookingReference: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  vendorName: string;
  vendorEmail?: string;
  vendorPhone?: string;
  bookingDate: string;
  bookingTime: string;
  partySize: number;
  packageName?: string;
  specialRequests?: string;
  totalAmount?: number;
  depositAmount?: number;
  bookingUrl?: string;
}

// Email sending response
interface SendEmailResponse {
  success: boolean;
  error?: string;
}

// Generate booking confirmation email HTML
export const generateBookingConfirmationEmail = (data: BookingEmailData): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #7c3aed 0%, #14b8a6 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                🍽️ boo.x.eat
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">
                Your booking is confirmed!
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="color: #1e1e1e; margin: 0 0 8px 0; font-size: 22px;">
                Hi ${data.customerName}! 👋
              </h2>
              <p style="color: #666666; margin: 0 0 24px 0; font-size: 16px; line-height: 1.6;">
                Your booking at <strong>${data.vendorName}</strong> has been confirmed. Here are your details:
              </p>
              
              <!-- Booking Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f8f8; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #888888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Reference</span>
                          <p style="color: #7c3aed; margin: 4px 0 0 0; font-size: 18px; font-weight: bold;">${data.bookingReference}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-top: 1px solid #e5e5e5;">
                          <span style="color: #888888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">📅 Date</span>
                          <p style="color: #1e1e1e; margin: 4px 0 0 0; font-size: 16px;">${data.bookingDate}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-top: 1px solid #e5e5e5;">
                          <span style="color: #888888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">🕐 Time</span>
                          <p style="color: #1e1e1e; margin: 4px 0 0 0; font-size: 16px;">${data.bookingTime}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-top: 1px solid #e5e5e5;">
                          <span style="color: #888888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">👥 Party Size</span>
                          <p style="color: #1e1e1e; margin: 4px 0 0 0; font-size: 16px;">${data.partySize} ${data.partySize === 1 ? 'person' : 'people'}</p>
                        </td>
                      </tr>
                      ${data.packageName ? `
                      <tr>
                        <td style="padding: 8px 0; border-top: 1px solid #e5e5e5;">
                          <span style="color: #888888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">📦 Package</span>
                          <p style="color: #1e1e1e; margin: 4px 0 0 0; font-size: 16px;">${data.packageName}</p>
                        </td>
                      </tr>
                      ` : ''}
                      ${data.totalAmount ? `
                      <tr>
                        <td style="padding: 8px 0; border-top: 1px solid #e5e5e5;">
                          <span style="color: #888888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">💰 Total</span>
                          <p style="color: #14b8a6; margin: 4px 0 0 0; font-size: 18px; font-weight: bold;">RM ${data.totalAmount.toFixed(2)}</p>
                        </td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>
              
              ${data.specialRequests ? `
              <div style="background-color: #fef3c7; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="color: #92400e; margin: 0; font-size: 14px;">
                  <strong>📝 Special Requests:</strong><br>
                  ${data.specialRequests}
                </p>
              </div>
              ` : ''}
              
              <!-- Important Notice -->
              <div style="background-color: #f0fdf4; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="color: #166534; margin: 0; font-size: 14px; line-height: 1.6;">
                  <strong>📍 Important:</strong> Please arrive 10 minutes before your booking time. If you need to cancel or modify your booking, please contact the vendor at least 24 hours in advance.
                </p>
              </div>
              
              ${data.bookingUrl ? `
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${data.bookingUrl}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #14b8a6 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                      View Booking Details
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f8f8; padding: 24px; text-align: center;">
              <p style="color: #888888; margin: 0 0 8px 0; font-size: 14px;">
                Questions? Contact ${data.vendorName}
              </p>
              ${data.vendorPhone ? `
              <p style="color: #666666; margin: 0 0 16px 0; font-size: 14px;">
                📞 ${data.vendorPhone}
              </p>
              ` : ''}
              <p style="color: #aaaaaa; margin: 0; font-size: 12px;">
                Powered by boo.x.eat - F&B Booking Made Easy
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

// Generate vendor notification email HTML
export const generateVendorNotificationEmail = (data: BookingEmailData): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Booking Received</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #14b8a6 0%, #7c3aed 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">
                🎉 New Booking!
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">
                Ref: ${data.bookingReference}
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="color: #1e1e1e; margin: 0 0 24px 0; font-size: 20px;">
                Booking Details
              </h2>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f8f8; border-radius: 12px;">
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" cellpadding="8" cellspacing="0">
                      <tr>
                        <td width="120" style="color: #888888; font-size: 14px;">Customer</td>
                        <td style="color: #1e1e1e; font-size: 14px; font-weight: bold;">${data.customerName}</td>
                      </tr>
                      <tr>
                        <td style="color: #888888; font-size: 14px;">Email</td>
                        <td style="color: #1e1e1e; font-size: 14px;">${data.customerEmail}</td>
                      </tr>
                      ${data.customerPhone ? `
                      <tr>
                        <td style="color: #888888; font-size: 14px;">Phone</td>
                        <td style="color: #1e1e1e; font-size: 14px;">${data.customerPhone}</td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="color: #888888; font-size: 14px;">Date</td>
                        <td style="color: #1e1e1e; font-size: 14px; font-weight: bold;">${data.bookingDate}</td>
                      </tr>
                      <tr>
                        <td style="color: #888888; font-size: 14px;">Time</td>
                        <td style="color: #1e1e1e; font-size: 14px; font-weight: bold;">${data.bookingTime}</td>
                      </tr>
                      <tr>
                        <td style="color: #888888; font-size: 14px;">Party Size</td>
                        <td style="color: #1e1e1e; font-size: 14px;">${data.partySize} pax</td>
                      </tr>
                      ${data.packageName ? `
                      <tr>
                        <td style="color: #888888; font-size: 14px;">Package</td>
                        <td style="color: #14b8a6; font-size: 14px; font-weight: bold;">${data.packageName}</td>
                      </tr>
                      ` : ''}
                      ${data.totalAmount ? `
                      <tr>
                        <td style="color: #888888; font-size: 14px;">Total</td>
                        <td style="color: #7c3aed; font-size: 16px; font-weight: bold;">RM ${data.totalAmount.toFixed(2)}</td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>
              
              ${data.specialRequests ? `
              <div style="background-color: #fef3c7; border-radius: 8px; padding: 16px; margin-top: 20px;">
                <p style="color: #92400e; margin: 0; font-size: 14px;">
                  <strong>Special Requests:</strong><br>
                  ${data.specialRequests}
                </p>
              </div>
              ` : ''}
              
              ${data.bookingUrl ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
                <tr>
                  <td align="center">
                    <a href="${data.bookingUrl}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #14b8a6 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 14px;">
                      View in Dashboard
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f8f8; padding: 20px; text-align: center;">
              <p style="color: #aaaaaa; margin: 0; font-size: 12px;">
                boo.x.eat Vendor Dashboard
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

// Generate booking reminder email HTML
export const generateBookingReminderEmail = (data: BookingEmailData): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">
                ⏰ Reminder
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">
                Your booking is coming up!
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="color: #1e1e1e; margin: 0 0 16px 0; font-size: 20px;">
                Hi ${data.customerName}! 👋
              </h2>
              <p style="color: #666666; margin: 0 0 24px 0; font-size: 16px; line-height: 1.6;">
                Just a friendly reminder about your upcoming reservation at <strong>${data.vendorName}</strong>.
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fffbeb; border: 2px solid #f59e0b; border-radius: 12px;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <p style="color: #92400e; margin: 0 0 8px 0; font-size: 14px;">📅 ${data.bookingDate}</p>
                    <p style="color: #78350f; margin: 0; font-size: 28px; font-weight: bold;">🕐 ${data.bookingTime}</p>
                    <p style="color: #92400e; margin: 8px 0 0 0; font-size: 14px;">👥 ${data.partySize} ${data.partySize === 1 ? 'person' : 'people'}</p>
                  </td>
                </tr>
              </table>
              
              <p style="color: #666666; margin: 24px 0; font-size: 14px; line-height: 1.6; text-align: center;">
                Please arrive 10 minutes early. See you soon!
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f8f8; padding: 20px; text-align: center;">
              <p style="color: #888888; margin: 0 0 8px 0; font-size: 14px;">
                Ref: ${data.bookingReference}
              </p>
              <p style="color: #aaaaaa; margin: 0; font-size: 12px;">
                Powered by boo.x.eat
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

// Send email via Supabase Edge Function
export const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<SendEmailResponse> => {
  try {
    // Call Supabase Edge Function for sending email
    const { error } = await supabase.functions.invoke('send-email', {
      body: { to, subject, html },
    });

    if (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Email exception:', err);
    return { success: false, error: 'Failed to send email. Please try again.' };
  }
};

// Send booking confirmation to customer
export const sendBookingConfirmation = async (data: BookingEmailData): Promise<SendEmailResponse> => {
  const html = generateBookingConfirmationEmail(data);
  return sendEmail(
    data.customerEmail,
    `Booking Confirmed at ${data.vendorName} - ${data.bookingReference}`,
    html
  );
};

// Send notification to vendor
export const sendVendorNotification = async (data: BookingEmailData): Promise<SendEmailResponse> => {
  if (!data.vendorEmail) {
    return { success: false, error: 'Vendor email not provided' };
  }
  
  const html = generateVendorNotificationEmail(data);
  return sendEmail(
    data.vendorEmail,
    `New Booking: ${data.customerName} - ${data.bookingDate} ${data.bookingTime}`,
    html
  );
};

// Send booking reminder
export const sendBookingReminder = async (data: BookingEmailData): Promise<SendEmailResponse> => {
  const html = generateBookingReminderEmail(data);
  return sendEmail(
    data.customerEmail,
    `Reminder: Your booking at ${data.vendorName} tomorrow`,
    html
  );
};

// Log notification to database
export const logNotification = async (
  bookingId: string,
  type: EmailTemplate,
  channel: 'email' | 'sms' | 'whatsapp',
  status: 'sent' | 'failed',
  recipient: string,
  errorMessage?: string
): Promise<void> => {
  try {
    await supabase.from('booking_notifications').insert({
      booking_id: bookingId,
      type,
      channel,
      status,
      recipient,
      error_message: errorMessage,
      sent_at: status === 'sent' ? new Date().toISOString() : null,
    } as never);
  } catch (err) {
    console.error('Failed to log notification:', err);
  }
};
