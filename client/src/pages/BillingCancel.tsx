import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, CreditCard } from "lucide-react";
import { Link } from "wouter";

export default function BillingCancel() {
  return (
    <div className="min-h-screen bg-felt-dark flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-black/60 backdrop-blur-sm border border-red-400/20">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
            <XCircle className="h-8 w-8 text-red-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-300">
            Payment Canceled
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div className="space-y-2">
            <p className="text-gray-300">
              Your payment was canceled and no charges were made.
            </p>
            <p className="text-sm text-gray-400">
              You can try again anytime or choose a different payment method.
            </p>
          </div>

          <div className="bg-gray-900/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-center gap-2 text-orange-400">
              <CreditCard className="h-4 w-4" />
              <span className="font-medium">No Payment Processed</span>
            </div>
            <p className="text-sm text-gray-400">
              Your account remains unchanged. You can try subscribing again when you're ready.
            </p>
          </div>

          <div className="space-y-3">
            <Link href="/signup">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700" data-testid="button-try-again">
                <CreditCard className="mr-2 h-4 w-4" />
                Try Payment Again
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full border-gray-600 text-white hover:bg-gray-800" data-testid="button-back-home">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Homepage
              </Button>
            </Link>
          </div>

          <div className="pt-4 border-t border-gray-700">
            <p className="text-xs text-gray-500">
              Need help? Contact our support team for assistance with payment issues.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}