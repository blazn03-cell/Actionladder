import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, CreditCard, Crown } from "lucide-react";
import { Link } from "wouter";

export default function BillingSuccess() {
  const searchParams = new URLSearchParams(window.location.search);
  const sessionId = searchParams.get('session_id');

  const { data: sessionData, isLoading } = useQuery({
    queryKey: ["/api/stripe/session", sessionId],
    enabled: !!sessionId,
    retry: false,
  });

  useEffect(() => {
    // Auto-redirect after 10 seconds
    const timer = setTimeout(() => {
      window.location.href = "/app";
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-felt-dark flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-black/60 backdrop-blur-sm border border-emerald-400/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 text-emerald-400 animate-spin mx-auto" />
              <h2 className="text-xl font-semibold text-white">Processing Payment...</h2>
              <p className="text-gray-400">Please wait while we confirm your payment</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-felt-dark flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-black/60 backdrop-blur-sm border border-emerald-400/20">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-emerald-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-emerald-300">
            Payment Successful!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-gray-300">
              <CreditCard className="h-4 w-4" />
              <span>Payment confirmed</span>
            </div>
            {sessionData && 'subscriptionTier' in sessionData && sessionData.subscriptionTier && (
              <div className="flex items-center justify-center gap-2 text-emerald-400">
                <Crown className="h-4 w-4" />
                <span>
                  {String(sessionData.subscriptionTier).charAt(0).toUpperCase() + 
                   String(sessionData.subscriptionTier).slice(1)} Subscription Active
                </span>
              </div>
            )}
          </div>

          <div className="bg-gray-900/50 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-white">Welcome to ActionLadder!</h3>
            <p className="text-sm text-gray-400">
              Your account is now active and ready to use. You'll be redirected to your dashboard automatically.
            </p>
          </div>

          <div className="space-y-3">
            <Link href="/app">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700" data-testid="button-go-to-dashboard">
                Go to Dashboard
              </Button>
            </Link>
            <Link href="/" className="block text-sm text-emerald-400 hover:text-emerald-300" data-testid="link-home">
              Return to Homepage
            </Link>
          </div>

          <p className="text-xs text-gray-500">
            You will be automatically redirected in 10 seconds
          </p>
        </CardContent>
      </Card>
    </div>
  );
}