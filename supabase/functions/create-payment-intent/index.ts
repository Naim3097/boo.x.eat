// =============================================
// SUPABASE EDGE FUNCTION: CREATE PAYMENT INTENT
// Stripe payment processing for boo.x.eat
// Deploy with: supabase functions deploy create-payment-intent
// =============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentIntentRequest {
  amount: number;
  currency: string;
  customer_email: string;
  customer_name: string;
  vendor_name: string;
  vendor_stripe_account_id?: string;
  description?: string;
  metadata?: Record<string, string>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: PaymentIntentRequest = await req.json();

    const {
      amount,
      currency = 'myr',
      customer_email,
      customer_name,
      vendor_name,
      vendor_stripe_account_id,
      description,
      metadata = {},
    } = body;

    if (!amount || amount < 100) {
      return new Response(
        JSON.stringify({ error: 'Amount must be at least RM 1.00 (100 cents)' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create payment intent parameters
    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(amount),
      currency: currency.toLowerCase(),
      description: description || `Booking deposit at ${vendor_name}`,
      metadata: {
        customer_email,
        customer_name,
        vendor_name,
        ...metadata,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    };

    // If vendor has Stripe Connect, use their account
    let stripeAccountId: string | undefined;
    if (vendor_stripe_account_id) {
      stripeAccountId = vendor_stripe_account_id;
      // Platform fee: 3%
      const applicationFee = Math.round(amount * 0.03);
      paymentIntentParams.application_fee_amount = applicationFee;
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create(
      paymentIntentParams,
      stripeAccountId ? { stripeAccount: stripeAccountId } : undefined
    );

    return new Response(
      JSON.stringify({
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Payment intent error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
