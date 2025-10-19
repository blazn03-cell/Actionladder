import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';

const PaymentsPage: React.FC = () => {
  const [loading, setLoading] = useState<string | null>(null);

  const checkoutMutation = useMutation({
    mutationFn: async ({ priceId, mode, metadata }: { priceId: string, mode?: string, metadata?: any }) => {
      return apiRequest('/api/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({ 
          priceId, 
          mode: mode || 'payment',
          userId: 'current_user_id', // Replace with actual user ID
          metadata 
        }),
      });
    },
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error) => {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    },
    onSettled: () => {
      setLoading(null);
    },
  });

  const paymentOptions = [
    { 
      priceId: 'price_1QZtpFJKQVJqL5dGYJhCyGPl', // Replace with actual price IDs from Stripe
      amount: '$25',
      description: 'Basic Entry Fee',
      mode: 'payment',
      metadata: { type: 'entry_fee', tier: 'basic' }
    },
    {
      priceId: 'price_1QZtpFJKQVJqL5dGYJhCyGP2', 
      amount: '$50',
      description: 'Tournament Entry',
      mode: 'payment',
      metadata: { type: 'tournament', tier: 'standard' }
    },
    {
      priceId: 'price_1QZtpFJKQVJqL5dGYJhCyGP3',
      amount: '$100', 
      description: 'Premium Package',
      mode: 'payment',
      metadata: { type: 'package', tier: 'premium' }
    },
    {
      priceId: 'price_1QZtpFJKQVJqL5dGYJhCyGP4',
      amount: '$200',
      description: 'High Stakes Entry',
      mode: 'payment',
      metadata: { type: 'high_stakes', tier: 'pro' }
    },
    {
      priceId: 'price_1QZtpFJKQVJqL5dGYJhCyGP5',
      amount: '$500',
      description: 'VIP Package',
      mode: 'payment',
      metadata: { type: 'vip', tier: 'elite' }
    },
    {
      priceId: 'price_1QZtpFJKQVJqL5dGYJhCyGP6',
      amount: '$25/month',
      description: 'Basic Membership',
      mode: 'subscription',
      metadata: { type: 'membership', tier: 'basic' }
    },
    {
      priceId: 'price_1QZtpFJKQVJqL5dGYJhCyGP7',
      amount: '$45/month',
      description: 'Pro Membership',
      mode: 'subscription',
      metadata: { type: 'membership', tier: 'pro' }
    }
  ];

  const handlePayment = (option: typeof paymentOptions[0]) => {
    setLoading(option.priceId);
    checkoutMutation.mutate({
      priceId: option.priceId,
      mode: option.mode,
      metadata: option.metadata
    });
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-green-400 neon-glow mb-4">
          PAYMENTS
        </h1>
        <p className="text-green-500 text-xl mb-2">
          Secure payments for tournament entries and ladder fees
        </p>
        <p className="text-green-600 text-sm">
          First rule of the hustle: You don't tell 'em where the bread came from. just eat
        </p>
      </div>

      {/* Payment Options */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paymentOptions.map((payment, index) => (
          <div 
            key={index}
            className="bg-green-900/10 border border-green-700/30 rounded-lg p-6 text-center hover:border-green-500/50 transition-all"
            data-testid={`payment-option-${index}`}
          >
            <div className="text-3xl font-bold text-yellow-400 cash-glow mb-2">
              {payment.amount}
            </div>
            <div className="text-green-400 font-bold mb-4">
              {payment.description}
            </div>
            <button
              onClick={() => handlePayment(payment)}
              disabled={loading === payment.priceId}
              className="btn-gold w-full"
              data-testid={`button-pay-${index}`}
            >
              {loading === payment.priceId ? 'Processing...' : '💳 Pay Now'}
            </button>
            {payment.mode === 'subscription' && (
              <div className="text-xs text-green-600 mt-2">
                Recurring monthly charge
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Payment Info */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-green-900/10 border border-green-700/30 rounded-lg p-6">
          <h3 className="text-xl font-bold text-green-400 mb-4">
            Payment Methods
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <span className="text-blue-400">💳</span>
              <span>Credit/Debit Cards via Stripe</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-400">💚</span>
              <span>Secure SSL encryption</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-yellow-400">⚡</span>
              <span>Instant payment processing</span>
            </div>
          </div>
        </div>

        <div className="bg-green-900/10 border border-green-700/30 rounded-lg p-6">
          <h3 className="text-xl font-bold text-green-400 mb-4">
            Challenge Limits
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span>Minimum Challenge Fee:</span>
              <span className="text-yellow-400 font-bold">$60</span>
            </div>
            <div className="flex justify-between">
              <span>Maximum Challenge Fee:</span>
              <span className="text-yellow-400 font-bold">$500,000</span>
            </div>
            <div className="text-xs text-green-600 mt-4">
              * Higher limits available for qualified players
            </div>
          </div>
        </div>
      </div>

      {/* Refund Policy */}
      <div className="bg-green-900/10 border border-green-700/30 rounded-lg p-6">
        <h3 className="text-xl font-bold text-green-400 mb-4">
          Payment Policy
        </h3>
        <div className="space-y-2 text-sm text-green-500">
          <p>• All payments are processed securely through Stripe</p>
          <p>• Tournament entries are non-refundable once matches begin</p>
          <p>• Membership fees are monthly and auto-renewing</p>
          <p>• Contact admin for payment disputes or special circumstances</p>
          <p>• High stakes matches require operator approval</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentsPage;