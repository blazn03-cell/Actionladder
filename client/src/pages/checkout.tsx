import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin,
      },
    });

    setIsProcessing(false);

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: "Thank you for your payment!",
      });
    }
  };

  return (
    <Card className="bg-black/60 backdrop-blur-sm border border-neon-green/20 shadow-felt max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-white text-center">Complete Payment</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <PaymentElement />
          <Button
            type="submit"
            disabled={!stripe || isProcessing}
            className="w-full bg-neon-green text-felt-dark hover:bg-neon-green/90"
            data-testid="button-submit-payment"
          >
            {isProcessing ? (
              <LoadingSpinner size="sm" />
            ) : (
              "Complete Payment"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default function Checkout() {
  const [clientSecret, setClientSecret] = useState("");
  const [paymentInfo, setPaymentInfo] = useState<{
    type: string;
    amount: number;
    description: string;
  } | null>(null);

  useEffect(() => {
    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    const id = urlParams.get('id');
    const amount = Number(urlParams.get('amount'));

    if (!type || !amount) {
      window.location.href = '/';
      return;
    }

    // Set payment info for display
    const getPaymentDescription = () => {
      switch (type) {
        case 'tournament':
          return 'Tournament Entry';
        case 'kelly-pool':
          return 'Kelly Pool Entry';
        default:
          return 'Payment';
      }
    };

    setPaymentInfo({
      type,
      amount,
      description: getPaymentDescription(),
    });

    // Create PaymentIntent as soon as the page loads
    apiRequest("POST", "/api/create-payment-intent", { 
      amount,
      tournamentId: type === 'tournament' ? id : undefined,
      kellyPoolId: type === 'kelly-pool' ? id : undefined,
    })
      .then((res) => res.json())
      .then((data) => {
        setClientSecret(data.clientSecret);
      })
      .catch((error) => {
        console.error('Error creating payment intent:', error);
        window.location.href = '/';
      });
  }, []);

  if (!clientSecret || !paymentInfo) {
    return (
      <div className="min-h-screen bg-felt-dark text-white font-sans flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" color="neon" />
          <p className="mt-4 text-gray-400">Preparing secure checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-felt-dark text-white font-sans">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-felt-texture opacity-90 pointer-events-none"></div>
      <div className="fixed inset-0 bg-smoky opacity-40 pointer-events-none"></div>
      
      <div className="relative z-10 py-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Secure Checkout</h1>
            <p className="text-gray-400">Powered by Stripe</p>
          </div>

          {/* Payment Summary */}
          <Card className="bg-black/60 backdrop-blur-sm border border-neon-green/20 shadow-felt max-w-md mx-auto mb-6">
            <CardHeader>
              <CardTitle className="text-white">Payment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">{paymentInfo.description}</span>
                  <span className="text-neon-green font-semibold">${paymentInfo.amount}</span>
                </div>
                <div className="border-t border-neon-green/20 pt-2">
                  <div className="flex justify-between font-bold">
                    <span className="text-white">Total</span>
                    <span className="text-neon-green">${paymentInfo.amount}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm />
          </Elements>

          {/* Security Notice */}
          <div className="text-center mt-6 text-sm text-gray-400">
            <p>🔒 Your payment information is secure and encrypted</p>
            <p>Processed by Stripe - Industry-leading payment security</p>
          </div>
        </div>
      </div>
    </div>
  );
}
