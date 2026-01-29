// =============================================
// PAYMENT FORM COMPONENT
// Stripe Elements integration for deposits
// =============================================

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Lock, 
  Loader2, 
  CheckCircle, 
  AlertCircle
} from 'lucide-react';
import { Button, Card } from '../ui';
import { formatAmount } from '../../lib/stripe';

// Note: In production, install @stripe/stripe-js and @stripe/react-stripe-js
// npm install @stripe/stripe-js @stripe/react-stripe-js

interface PaymentFormProps {
  amount: number; // In Ringgit
  currency?: string;
  vendorName: string;
  bookingReference: string;
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
  clientSecret?: string;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  amount,
  currency = 'MYR',
  vendorName,
  bookingReference,
  onSuccess,
  onCancel,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  clientSecret: _clientSecret,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  // Simulated payment processing (replace with actual Stripe Elements)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);

    try {
      // In production, use Stripe Elements confirmPayment:
      // const { error, paymentIntent } = await stripe.confirmPayment({
      //   elements,
      //   confirmParams: { return_url: window.location.origin + '/booking/success' },
      //   redirect: 'if_required',
      // });

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate success
      setIsComplete(true);
      setTimeout(() => {
        onSuccess('pi_simulated_' + Date.now());
      }, 1500);

    } catch (err) {
      setError('Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  if (isComplete) {
    return (
      <Card variant="elevated" className="p-8 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <CheckCircle className="w-10 h-10 text-green-500" />
        </motion.div>
        <h3 className="text-xl font-bold text-dark-900 mb-2">Payment Successful!</h3>
        <p className="text-dark-500">Your deposit has been processed.</p>
      </Card>
    );
  }

  return (
    <Card variant="elevated" className="overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-accent-600 p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold">Secure Payment</h3>
            <p className="text-sm text-white/80">Deposit for {vendorName}</p>
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div className="p-6">
        {/* Amount Summary */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-dark-600">Booking Reference</span>
            <span className="font-mono text-dark-900">{bookingReference}</span>
          </div>
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
            <span className="font-semibold text-dark-900">Deposit Amount</span>
            <span className="text-xl font-bold text-primary-600">
              {formatAmount(amount, currency)}
            </span>
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit}>
          {/* Card Number */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-dark-700 mb-2">
              Card Number
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="4242 4242 4242 4242"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={isProcessing}
              />
              <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* Expiry & CVV */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">
                Expiry Date
              </label>
              <input
                type="text"
                placeholder="MM/YY"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={isProcessing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">
                CVV
              </label>
              <input
                type="text"
                placeholder="123"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={isProcessing}
              />
            </div>
          </div>

          {/* Cardholder Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-dark-700 mb-2">
              Cardholder Name
            </label>
            <input
              type="text"
              placeholder="John Doe"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={isProcessing}
            />
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-red-600 text-sm mb-4 p-3 bg-red-50 rounded-lg"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onCancel}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Pay {formatAmount(amount, currency)}
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Security Note */}
        <div className="flex items-center justify-center gap-2 mt-4 text-xs text-dark-400">
          <Lock className="w-3 h-3" />
          <span>Secured by Stripe. Your card details are encrypted.</span>
        </div>
      </div>
    </Card>
  );
};

// Payment Success Component
interface PaymentSuccessProps {
  amount: number;
  currency?: string;
  vendorName: string;
  bookingReference: string;
  onContinue: () => void;
}

export const PaymentSuccess: React.FC<PaymentSuccessProps> = ({
  amount,
  currency = 'MYR',
  vendorName,
  bookingReference,
  onContinue,
}) => {
  return (
    <Card variant="elevated" className="p-8 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="w-20 h-20 bg-gradient-to-br from-green-100 to-accent-100 rounded-full flex items-center justify-center mx-auto mb-6"
      >
        <CheckCircle className="w-10 h-10 text-green-500" />
      </motion.div>
      
      <h2 className="text-2xl font-bold text-dark-900 mb-2">Payment Successful!</h2>
      <p className="text-dark-500 mb-6">
        Your deposit of {formatAmount(amount, currency)} for {vendorName} has been confirmed.
      </p>
      
      <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
        <div className="flex justify-between items-center mb-2">
          <span className="text-dark-500">Reference</span>
          <span className="font-mono font-semibold">{bookingReference}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-dark-500">Amount Paid</span>
          <span className="font-semibold text-green-600">{formatAmount(amount, currency)}</span>
        </div>
      </div>
      
      <Button variant="primary" onClick={onContinue} className="w-full">
        Continue
      </Button>
      
      <p className="text-xs text-dark-400 mt-4">
        A confirmation email has been sent to your email address.
      </p>
    </Card>
  );
};

export default PaymentForm;
