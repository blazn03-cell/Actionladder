import React, { useState, useEffect } from 'react';
import { SubscribeButton, ManageBillingButton } from '../components/SubscribeButton';

interface SubscriptionTier {
  tier: string;
  name: string;
  price: number;
  maxPlayers: number;
  perks: string[];
}

const subscriptionTiers: SubscriptionTier[] = [
  {
    tier: "small",
    name: "Small Hall / Starter",
    price: 199,
    maxPlayers: 15,
    perks: [
      "Up to 15 active players",
      "Full ladder management system", 
      "Basic analytics dashboard",
      "Email + chat support"
    ]
  },
  {
    tier: "medium", 
    name: "Medium Hall",
    price: 299,
    maxPlayers: 25,
    perks: [
      "Up to 25 active players",
      "Full ladder management system",
      "Advanced analytics",
      "Priority support"
    ]
  },
  {
    tier: "large",
    name: "Large Hall", 
    price: 399,
    maxPlayers: 40,
    perks: [
      "Up to 40 active players",
      "Full ladder management system",
      "Advanced analytics + operator ROI reports", 
      "Priority support + training"
    ]
  },
  {
    tier: "mega",
    name: "Mega Hall / Multi-Location",
    price: 799,
    maxPlayers: 999999,
    perks: [
      "Unlimited players",
      "Full ladder management system",
      "Multi-hall dashboard", 
      "White-label branding options",
      "Dedicated account rep"
    ]
  }
];

interface MembershipStatus {
  userId: string;
  role: string;
  status: string;
  stripeCustomerId?: string;
  perks: {
    maxPlayers: number;
    pricePerMonth: number;
  };
}

const OperatorDashboard: React.FC = () => {
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus | null>(null);
  const [playerCount, setPlayerCount] = useState(12);
  const [loading, setLoading] = useState(true);

  // Mock operator data - replace with actual auth
  const currentOperator = {
    id: 'operator_123',
    email: 'owner@poolhall.com',
    hallId: 'hall_abc'
  };

  useEffect(() => {
    fetchMembershipStatus();
  }, []);

  const fetchMembershipStatus = async () => {
    try {
      const res = await fetch(`/api/membership/status?userId=${currentOperator.id}`);
      const data = await res.json();
      setMembershipStatus(data);
    } catch (error) {
      console.error('Failed to fetch membership status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRecommendedTier = (count: number) => {
    return subscriptionTiers.find(tier => 
      count <= tier.maxPlayers || tier.tier === 'mega'
    ) || subscriptionTiers[0];
  };

  const recommendedTier = getRecommendedTier(playerCount);
  const currentTier = subscriptionTiers.find(tier => tier.tier === membershipStatus?.role);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-green-400 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="text-2xl">Loading operator dashboard...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-400 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center py-12 bg-green-900/10 rounded-lg border border-green-700/30 mb-8">
          <h1 className="text-5xl font-bold text-green-400 neon-glow mb-4">
            ACTION LADDER
          </h1>
          <p className="text-xl text-green-500 mb-2">
            Operator Dashboard - SaaS Billing Management
          </p>
          <p className="text-green-600 text-sm">
            First rule of the hustle: You don't tell 'em where the bread came from. just eat
          </p>
        </div>

        {/* Current Status */}
        {currentTier && (
          <div className="bg-green-900/20 border border-green-600/50 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">Current Subscription</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-semibold text-green-400 mb-2">{currentTier.name}</h3>
                <p className="text-3xl font-bold text-yellow-400 mb-2">${currentTier.price}/month</p>
                <p className="text-green-500">Status: {membershipStatus?.status}</p>
                <p className="text-green-500">Max Players: {currentTier.maxPlayers === 999999 ? 'Unlimited' : currentTier.maxPlayers}</p>
              </div>
              <div>
                {membershipStatus?.stripeCustomerId && (
                  <ManageBillingButton 
                    customerId={membershipStatus.stripeCustomerId}
                    className="mb-4"
                  />
                )}
                <div className="text-sm text-green-600">
                  <h4 className="font-semibold mb-1">Current Benefits:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {currentTier.perks.map((perk, index) => (
                      <li key={index}>{perk}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Player Count Input */}
        <div className="bg-green-900/10 border border-green-700/30 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-green-400 mb-4">Plan Your Subscription</h2>
          <div className="mb-4">
            <label className="block text-green-400 text-sm font-semibold mb-2">
              Current/Expected Player Count:
            </label>
            <input
              type="number"
              value={playerCount}
              onChange={(e) => setPlayerCount(Number(e.target.value))}
              className="bg-green-900/20 border border-green-700/50 rounded px-3 py-2 text-green-400 w-32"
              min="1"
              max="200"
              data-testid="input-player-count"
            />
          </div>
          <div className="text-green-500">
            <p>Recommended Tier: <span className="font-bold text-yellow-400">{recommendedTier.name}</span></p>
            <p>Price: <span className="font-bold text-yellow-400">${recommendedTier.price}/month</span></p>
          </div>
        </div>

        {/* Subscription Tiers */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-green-400 mb-6">Choose Your Subscription Tier</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {subscriptionTiers.map((tier) => (
              <div
                key={tier.tier}
                className={`bg-green-900/10 border rounded-lg p-6 text-center transition-all ${
                  tier.tier === recommendedTier.tier
                    ? 'border-yellow-500 bg-yellow-500/10'
                    : 'border-green-700/30 hover:border-green-500/50'
                }`}
                data-testid={`tier-card-${tier.tier}`}
              >
                {tier.tier === recommendedTier.tier && (
                  <div className="bg-yellow-500 text-black text-xs font-bold py-1 px-2 rounded mb-2">
                    RECOMMENDED
                  </div>
                )}
                <h3 className="text-lg font-bold text-green-400 mb-2">{tier.name}</h3>
                <div className="text-3xl font-bold text-yellow-400 mb-2">${tier.price}</div>
                <div className="text-green-500 text-sm mb-4">per month</div>
                <div className="text-green-600 text-sm mb-6">
                  Up to {tier.maxPlayers === 999999 ? 'unlimited' : tier.maxPlayers} players
                </div>
                
                <ul className="text-xs text-green-500 text-left mb-6 space-y-1">
                  {tier.perks.map((perk, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-400 mr-1">•</span>
                      {perk}
                    </li>
                  ))}
                </ul>

                {(!currentTier || currentTier.tier !== tier.tier) && (
                  <SubscribeButton
                    hallId={currentOperator.hallId}
                    operatorId={currentOperator.id}
                    playerCount={tier.maxPlayers === 999999 ? playerCount : tier.maxPlayers}
                    email={currentOperator.email}
                    label={currentTier ? 'Upgrade' : 'Subscribe'}
                    className="w-full"
                  />
                )}
                
                {currentTier?.tier === tier.tier && (
                  <div className="w-full py-2 px-4 bg-green-600/20 border border-green-600 rounded-xl text-green-400 text-sm font-semibold">
                    Current Plan
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Legal Notice */}
        <div className="bg-green-900/10 border border-green-700/30 rounded-lg p-6 text-center">
          <h3 className="text-lg font-bold text-green-400 mb-2">Action Ladder - Legal Framework</h3>
          <p className="text-sm text-green-600 mb-2">
            SaaS platform for skill-based competition management. All fees are subscription charges for software access.
          </p>
          <p className="text-xs text-green-700">
            Players pay entry fees and challenge fees within the software. Operators distribute league prizes from collected fees.
            Private side arrangements between players are not part of the official ladder system.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OperatorDashboard;