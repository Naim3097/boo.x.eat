// =============================================
// STRIPE PAYMENT INTEGRATION
// Deposit payments for boo.x.eat bookings
// =============================================

import { supabase } from './supabase';

// Stripe configuration
export interface StripeConfig {
  publishableKey: string;
  accountId?: string; // For Stripe Connect
}

// Payment intent data
export interface PaymentIntentData {
  bookingId: string;
  amount: number; // In cents (e.g., RM 10.00 = 1000)
  currency: string;
  customerEmail: string;
  customerName: string;
  vendorName: string;
  vendorStripeAccountId?: string;
  description?: string;
  metadata?: Record<string, string>;
}

// Payment result
export interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  clientSecret?: string;
  error?: string;
}

// Create payment intent via Supabase Edge Function
export const createPaymentIntent = async (
  data: PaymentIntentData
): Promise<PaymentResult> => {
  try {
    const { data: result, error } = await supabase.functions.invoke('create-payment-intent', {
      body: {
        amount: data.amount,
        currency: data.currency || 'myr',
        customer_email: data.customerEmail,
        customer_name: data.customerName,
        vendor_name: data.vendorName,
        vendor_stripe_account_id: data.vendorStripeAccountId,
        description: data.description || `Booking deposit at ${data.vendorName}`,
        metadata: {
          booking_id: data.bookingId,
          ...data.metadata,
        },
      },
    });

    if (error) {
      console.error('Payment intent error:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      paymentIntentId: result.paymentIntentId,
      clientSecret: result.clientSecret,
    };
  } catch (err) {
    console.error('Payment intent exception:', err);
    return { success: false, error: 'Failed to create payment. Please try again.' };
  }
};

// Confirm payment status
export const confirmPaymentStatus = async (
  paymentIntentId: string
): Promise<{ status: string; error?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke('check-payment-status', {
      body: { payment_intent_id: paymentIntentId },
    });

    if (error) {
      return { status: 'error', error: error.message };
    }

    return { status: data.status };
  } catch (err) {
    console.error('Payment status exception:', err);
    return { status: 'error', error: 'Failed to check payment status' };
  }
};

// Update booking payment status
export const updateBookingPaymentStatus = async (
  bookingId: string,
  paymentIntentId: string,
  status: 'pending' | 'paid' | 'failed' | 'refunded'
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('bookings')
      .update({
        payment_status: status,
        payment_intent_id: paymentIntentId,
        paid_at: status === 'paid' ? new Date().toISOString() : null,
      } as never)
      .eq('id', bookingId);

    return !error;
  } catch (err) {
    console.error('Update payment status exception:', err);
    return false;
  }
};

// Calculate deposit amount
export const calculateDepositAmount = (
  totalAmount: number,
  depositRequired: boolean,
  depositAmount?: number | null,
  depositPercentage?: number | null
): number => {
  if (!depositRequired) return 0;
  
  if (depositAmount) {
    return depositAmount * 100; // Convert to cents
  }
  
  if (depositPercentage) {
    return Math.round((totalAmount * depositPercentage / 100) * 100); // Convert to cents
  }
  
  // Default: 10% deposit
  return Math.round(totalAmount * 0.1 * 100);
};

// Format amount for display (from cents)
export const formatAmountFromCents = (cents: number, currency: string = 'MYR'): string => {
  const amount = cents / 100;
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

// Format amount for display (from ringgit)
export const formatAmount = (amount: number, currency: string = 'MYR'): string => {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

// Stripe Connect - Create connected account
export const createConnectedAccount = async (
  vendorId: string,
  email: string,
  businessName: string
): Promise<{ accountId: string; onboardingUrl: string } | { error: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke('create-stripe-account', {
      body: {
        vendor_id: vendorId,
        email: email,
        business_name: businessName,
      },
    });

    if (error) {
      return { error: error.message };
    }

    return {
      accountId: data.accountId,
      onboardingUrl: data.onboardingUrl,
    };
  } catch (err) {
    console.error('Create connected account exception:', err);
    return { error: 'Failed to create Stripe account' };
  }
};

// Get Stripe account status
export const getStripeAccountStatus = async (
  accountId: string
): Promise<{ status: string; detailsSubmitted: boolean; chargesEnabled: boolean } | { error: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke('get-stripe-account-status', {
      body: { account_id: accountId },
    });

    if (error) {
      return { error: error.message };
    }

    return {
      status: data.status,
      detailsSubmitted: data.details_submitted,
      chargesEnabled: data.charges_enabled,
    };
  } catch (err) {
    console.error('Get account status exception:', err);
    return { error: 'Failed to get Stripe account status' };
  }
};

// Process refund
export const processRefund = async (
  paymentIntentId: string,
  amount?: number, // Optional - partial refund in cents
  reason?: string
): Promise<{ success: boolean; refundId?: string; error?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke('process-refund', {
      body: {
        payment_intent_id: paymentIntentId,
        amount: amount,
        reason: reason,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, refundId: data.refundId };
  } catch (err) {
    console.error('Refund exception:', err);
    return { success: false, error: 'Failed to process refund' };
  }
};
