import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { SafeText, SafeHeading } from "@/components/SafeText";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Users, TrendingUp, PieChart, BarChart3, CreditCard } from "lucide-react";

interface StakeholderEarnings {
  actionLadderTotal: number;
  operatorTotal: number;
  bonusFundTotal: number;
  playerWinnings: number;
  monthlyGrowth: number;
}

interface CommissionBreakdown {
  originalAmount: number;
  commissionRate: number;
  calculatedCommission: number;
  roundedCommission: number;
  actionLadderShare: number;
  operatorShare: number;
  bonusFundShare: number;
  prizePool: number;
}

interface MembershipTier {
  name: string;
  price: number;
  commissionRate: number;
  perks: string[];
  description: string;
}

export default function MonetizationDashboard() {
  const [earnings, setEarnings] = useState<StakeholderEarnings>({
    actionLadderTotal: 0,
    operatorTotal: 0,
    bonusFundTotal: 0,
    playerWinnings: 0,
    monthlyGrowth: 0
  });
  const [tiers, setTiers] = useState<MembershipTier[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Commission Calculator
  const [commissionAmount, setCommissionAmount] = useState(100);
  const [commissionTier, setCommissionTier] = useState("none");
  const [commission, setCommission] = useState<CommissionBreakdown | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load membership tiers
      const tierResponse = await apiRequest("GET", "/api/pricing/tiers");
      setTiers(tierResponse);
      
      // Simulate earnings data - in production this would come from your database
      setEarnings({
        actionLadderTotal: 12850, // $128.50
        operatorTotal: 7710,     // $77.10  
        bonusFundTotal: 5140,    // $51.40
        playerWinnings: 45600,   // $456.00
        monthlyGrowth: 23.5
      });
      
      setLoading(false);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      setLoading(false);
    }
  };

  const calculateCommissionBreakdown = async () => {
    try {
      const response = await apiRequest("POST", "/api/pricing/calculate-commission", {
        amount: commissionAmount * 100, // Convert to cents
        membershipTier: commissionTier
      });
      setCommission(response);
    } catch (error) {
      console.error("Failed to calculate commission:", error);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(cents / 100);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <SafeHeading className="text-3xl font-bold text-green-400">
              Revenue & Payout Dashboard
            </SafeHeading>
            <SafeText className="text-gray-400 mt-2">
              Complete financial overview for all stakeholders
            </SafeText>
          </div>
          <Badge variant="outline" className="text-green-400 border-green-400">
            Monthly Growth: +{formatPercent(earnings.monthlyGrowth)}
          </Badge>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-gray-900 border-gray-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-green-600">
              Stakeholder Overview
            </TabsTrigger>
            <TabsTrigger value="calculator" className="data-[state=active]:bg-green-600">
              Commission Calculator
            </TabsTrigger>
            <TabsTrigger value="tiers" className="data-[state=active]:bg-green-600">
              Membership Tiers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Revenue Distribution Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Action Ladder (You & Trustee) */}
              <Card className="bg-gray-900 border-green-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-green-400 flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Action Ladder (50%)
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Platform Revenue
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {formatCurrency(earnings.actionLadderTotal)}
                  </div>
                  <SafeText className="text-sm text-gray-400 mt-2">
                    Owner + Trustee Share
                  </SafeText>
                </CardContent>
              </Card>

              {/* Operator Revenue */}
              <Card className="bg-gray-900 border-blue-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-blue-400 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Operators (30%)
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Pool Hall Partners
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {formatCurrency(earnings.operatorTotal)}
                  </div>
                  <SafeText className="text-sm text-gray-400 mt-2">
                    Hall Operator Payouts
                  </SafeText>
                </CardContent>
              </Card>

              {/* Bonus Fund */}
              <Card className="bg-gray-900 border-purple-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-purple-400 flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Bonus Fund (20%)
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Community Rewards
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {formatCurrency(earnings.bonusFundTotal)}
                  </div>
                  <SafeText className="text-sm text-gray-400 mt-2">
                    Player Incentives
                  </SafeText>
                </CardContent>
              </Card>

              {/* Player Winnings */}
              <Card className="bg-gray-900 border-orange-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-orange-400 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Player Winnings
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Prize Pool Payouts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {formatCurrency(earnings.playerWinnings)}
                  </div>
                  <SafeText className="text-sm text-gray-400 mt-2">
                    Total Player Earnings
                  </SafeText>
                </CardContent>
              </Card>
            </div>

            {/* Revenue Split Breakdown */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Revenue Split Model
                </CardTitle>
                <CardDescription>
                  How every dollar is distributed across stakeholders
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-green-900/20 border border-green-500/30">
                    <h4 className="text-green-400 font-semibold">Action Ladder Platform</h4>
                    <p className="text-2xl font-bold text-white">50%</p>
                    <SafeText className="text-sm text-gray-400">
                      Technology, development, marketing
                    </SafeText>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-900/20 border border-blue-500/30">
                    <h4 className="text-blue-400 font-semibold">Pool Hall Operators</h4>
                    <p className="text-2xl font-bold text-white">30%</p>
                    <SafeText className="text-sm text-gray-400">
                      Venue partnerships, local support
                    </SafeText>
                  </div>
                  <div className="p-4 rounded-lg bg-purple-900/20 border border-purple-500/30">
                    <h4 className="text-purple-400 font-semibold">Community Bonus Fund</h4>
                    <p className="text-2xl font-bold text-white">20%</p>
                    <SafeText className="text-sm text-gray-400">
                      Tournaments, prizes, player incentives
                    </SafeText>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calculator" className="space-y-6">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Commission Calculator</CardTitle>
                <CardDescription>
                  Calculate revenue splits for any match amount
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Match Amount ($)</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={commissionAmount}
                      onChange={(e) => setCommissionAmount(Number(e.target.value))}
                      className="bg-gray-800 border-gray-600 text-white"
                      placeholder="100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tier">Player Membership Tier</Label>
                    <Select value={commissionTier} onValueChange={setCommissionTier}>
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                        <SelectValue placeholder="Select tier" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="none">Non-Member (10%)</SelectItem>
                        <SelectItem value="rookie">Rookie (10%)</SelectItem>
                        <SelectItem value="basic">Basic (8%)</SelectItem>
                        <SelectItem value="pro">Pro (5%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button 
                  onClick={calculateCommissionBreakdown}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  data-testid="button-calculate-commission"
                >
                  Calculate Commission Split
                </Button>

                {commission && (
                  <div className="mt-6 p-4 rounded-lg bg-gray-800 border border-gray-600">
                    <h4 className="text-lg font-semibold text-white mb-3">Commission Breakdown</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Prize Pool</p>
                        <p className="text-xl font-bold text-green-400">
                          {formatCurrency(commission.prizePool)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Action Ladder</p>
                        <p className="text-xl font-bold text-blue-400">
                          {formatCurrency(commission.actionLadderShare)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Operator</p>
                        <p className="text-xl font-bold text-purple-400">
                          {formatCurrency(commission.operatorShare)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Bonus Fund</p>
                        <p className="text-xl font-bold text-orange-400">
                          {formatCurrency(commission.bonusFundShare)}
                        </p>
                      </div>
                    </div>
                    <Separator className="my-3 bg-gray-600" />
                    <div className="text-sm text-gray-400">
                      <p>Commission Rate: {(commission.commissionRate / 100).toFixed(1)}%</p>
                      <p>Total Commission: {formatCurrency(commission.roundedCommission)} (rounded up)</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tiers" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {tiers.map((tier) => (
                <Card key={tier.name} className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-green-400 flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      {tier.name}
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      {tier.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {formatCurrency(tier.price)}
                        <span className="text-sm font-normal text-gray-400">/month</span>
                      </p>
                      <p className="text-sm text-gray-400">
                        Commission: {(tier.commissionRate / 100).toFixed(1)}%
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-white mb-2">Perks</h4>
                      <ul className="space-y-1">
                        {tier.perks.map((perk, index) => (
                          <li key={index} className="text-sm text-gray-400 flex items-start gap-2">
                            <span className="text-green-400 mt-1">•</span>
                            <SafeText>{perk.replace(/_/g, ' ')}</SafeText>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}