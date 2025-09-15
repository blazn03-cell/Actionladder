
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Calculator } from 'lucide-react';

export function RevenueCalculator() {
  const [playerCount, setPlayerCount] = useState(25);
  const [subscriptionFee] = useState(79); // Fixed pro subscription fee
  const [matchesPerMonth] = useState(2); // Average matches per player per month
  const [entryFee] = useState(100); // Average entry fee in dollars

  const projections = useMemo(() => {
    const totalSubscriptionRevenue = playerCount * subscriptionFee;
    const totalEntryFees = playerCount * entryFee * matchesPerMonth;
    const serviceFee = totalEntryFees * 0.08;
    const operatorShare = (totalEntryFees - serviceFee) * 0.30;
    const subscriptionOperatorShare = totalSubscriptionRevenue * 0.30;
    
    return {
      totalRevenue: operatorShare + subscriptionOperatorShare,
      subscriptionRevenue: subscriptionOperatorShare,
      challengeFeeRevenue: operatorShare,
      totalPot: totalEntryFees - serviceFee
    };
  }, [playerCount, subscriptionFee, matchesPerMonth, entryFee]);

  return (
    <Card className="bg-gray-900/60 border-emerald-500/30">
      <CardHeader>
        <CardTitle className="text-emerald-400 flex items-center">
          <Calculator className="w-5 h-5 mr-2" />
          Revenue Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="playerCount" className="text-gray-300">
            Number of Active Players
          </Label>
          <Input
            id="playerCount"
            type="number"
            value={playerCount}
            onChange={(e) => setPlayerCount(Math.max(1, parseInt(e.target.value) || 1))}
            className="bg-black/40 border-emerald-600/50 text-white"
            min="1"
            max="500"
          />
        </div>

        <div className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-white">
              ${projections.totalRevenue.toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">Monthly Revenue Potential</div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Subscription Revenue (30%):</span>
              <span className="text-emerald-300">
                ${projections.subscriptionRevenue.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Challenge Fees (30%):</span>
              <span className="text-emerald-300">
                ${projections.challengeFeeRevenue.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between border-t border-gray-700 pt-2">
              <span className="text-gray-300 font-medium">Total Monthly:</span>
              <span className="text-emerald-300 font-bold">
                ${projections.totalRevenue.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="mt-4">
            <Badge className="w-full justify-center bg-emerald-900/30 text-emerald-300">
              {playerCount >= 50 ? 'High Volume' : playerCount >= 25 ? 'Growing' : 'Starter'} Revenue Tier
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
