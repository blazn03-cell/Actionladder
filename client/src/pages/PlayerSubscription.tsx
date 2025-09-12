import { PlayerSubscriptionTiers } from "@/components/PlayerSubscriptionTiers";
import { useQuery } from "@tanstack/react-query";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  globalRole: string;
  hallName: string | null;
  city: string | null;
  state: string | null;
  subscriptionTier: string | null;
  accountStatus: string | null;
  onboardingComplete: boolean;
}

export function PlayerSubscription() {
  const { data: user, isLoading } = useQuery<AuthUser>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner />
          <h1 className="text-2xl font-bold">Loading...</h1>
          <p className="text-gray-400">
            Getting your account information...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Please Sign In</h1>
          <p className="text-gray-400">
            You need to be signed in to manage your subscription.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
              Player Subscription Plans
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Join the modern billiards platform that saves you money while elevating your game. 
              Action Ladder costs $21-$41+ less per month than traditional leagues.
            </p>
          </div>

          {/* Subscription Tiers Component */}
          <PlayerSubscriptionTiers 
            userId={user.id} 
            currentUserRole={user.globalRole}
          />

          {/* FAQ Section */}
          <div className="mt-16 space-y-8">
            <h2 className="text-2xl font-bold text-center text-white">
              Frequently Asked Questions
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-emerald-400">How much do I save?</h3>
                  <p className="text-sm text-gray-300">
                    Traditional leagues cost $80+ per month. Our Rookie plan starts at $39/month, 
                    Standard at $59/month, and Premium at $79/month - saving you $21-$41+ monthly.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold text-emerald-400">What's the commission rate?</h3>
                  <p className="text-sm text-gray-300">
                    Rookie: 15%, Standard: 10%, Premium: 5%. Lower rates mean you keep more 
                    of your winnings from challenges and tournaments.
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-emerald-400">Can I cancel anytime?</h3>
                  <p className="text-sm text-gray-300">
                    Yes! You can cancel your subscription at any time. Your benefits continue 
                    until the end of your current billing period.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold text-emerald-400">What payment methods?</h3>
                  <p className="text-sm text-gray-300">
                    We accept all major credit cards and ACH bank transfers through Stripe. 
                    All payments are secure and encrypted.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}