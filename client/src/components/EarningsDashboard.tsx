import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, Users, Percent, Calendar, Download } from "lucide-react";

interface EarningsData {
  totalEarnings: number;
  matchCommissions: number;
  membershipCommissions: number;
  escrowCommissions: number;
  operatorShare: number;
  platformShare: number;
  currentMRR: number;
  growthRate: number;
}

interface CommissionBreakdown {
  sourceType: string;
  amount: number;
  count: number;
  averageCommission: number;
}

function EarningsStats({ data }: { data: EarningsData }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-500/20">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            <div>
              <div className="text-2xl font-bold text-green-400">
                ${(data.totalEarnings / 100).toLocaleString()}
              </div>
              <div className="text-xs text-gray-400">Total Earnings</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-500/20">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <div>
              <div className="text-2xl font-bold text-blue-400">
                ${(data.currentMRR / 100).toLocaleString()}
              </div>
              <div className="text-xs text-gray-400">Monthly Recurring</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/20">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-purple-400" />
            <div>
              <div className="text-2xl font-bold text-purple-400">
                ${(data.operatorShare / 100).toLocaleString()}
              </div>
              <div className="text-xs text-gray-400">Operator Share</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-900/20 to-orange-800/10 border-orange-500/20">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Percent className="w-5 h-5 text-orange-400" />
            <div>
              <div className="text-2xl font-bold text-orange-400">
                {data.growthRate.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-400">Growth Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CommissionBreakdown({ breakdown }: { breakdown: CommissionBreakdown[] }) {
  return (
    <Card className="bg-black/60 backdrop-blur-sm border border-neon-green/20 shadow-felt">
      <CardHeader>
        <CardTitle className="text-white">Commission Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {breakdown.map((item) => (
            <div key={item.sourceType} className="flex items-center justify-between p-3 bg-gradient-to-r from-white/5 to-transparent rounded-lg">
              <div>
                <div className="font-semibold text-white capitalize">
                  {item.sourceType.replace('_', ' ')}
                </div>
                <div className="text-sm text-gray-400">
                  {item.count} transactions • Avg: ${(item.averageCommission / 100).toFixed(2)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-neon-green">
                  ${(item.amount / 100).toLocaleString()}
                </div>
                <div className="text-xs text-gray-400">
                  Total Earned
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function CommissionRates() {
  return (
    <Card className="bg-black/60 backdrop-blur-sm border border-neon-green/20 shadow-felt">
      <CardHeader>
        <CardTitle className="text-white">Current Commission Structure</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Match Commissions */}
          <div>
            <h4 className="font-semibold text-green-400 mb-3">Match Commission Rates</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                <div className="text-red-400 font-semibold">Non-Members</div>
                <div className="text-sm text-gray-300 mt-1">
                  Platform: 15% • Operator: 5%
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Higher rates encourage membership
                </div>
              </div>
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                <div className="text-blue-400 font-semibold">Basic Members</div>
                <div className="text-sm text-gray-300 mt-1">
                  Platform: 10% • Operator: 6%
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Standard membership benefits
                </div>
              </div>
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                <div className="text-green-400 font-semibold">Pro Members</div>
                <div className="text-sm text-gray-300 mt-1">
                  Platform: 8% • Operator: 7%
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Premium tier with reduced rates
                </div>
              </div>
            </div>
          </div>

          {/* Membership Commissions */}
          <div>
            <h4 className="font-semibold text-green-400 mb-3">Membership Operator Commissions</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
                <div className="text-yellow-400 font-semibold">Rookie Pass ($20/mo)</div>
                <div className="text-sm text-gray-300 mt-1">
                  Operator Commission: $4
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  20% of subscription fee
                </div>
              </div>
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                <div className="text-blue-400 font-semibold">Basic ($25/mo)</div>
                <div className="text-sm text-gray-300 mt-1">
                  Operator Commission: $7
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  28% of subscription fee
                </div>
              </div>
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                <div className="text-green-400 font-semibold">Pro ($60/mo)</div>
                <div className="text-sm text-gray-300 mt-1">
                  Operator Commission: $10
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  16.7% of subscription fee
                </div>
              </div>
            </div>
          </div>

          {/* Escrow Commissions */}
          <div>
            <h4 className="font-semibold text-green-400 mb-3">Challenge Pool Escrow Fees</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3">
                <div className="text-purple-400 font-semibold">Standard Pools</div>
                <div className="text-sm text-gray-300 mt-1">
                  Platform Fee: 5%
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  For pools under $500
                </div>
              </div>
              <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-3">
                <div className="text-orange-400 font-semibold">High-Volume Pools</div>
                <div className="text-sm text-gray-300 mt-1">
                  Platform Fee: 2%
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  For pools $500 and above
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function EarningsDashboard() {
  const [timeframe, setTimeframe] = useState("month");
  const [operatorId, setOperatorId] = useState("all");

  const { data: earningsData, isLoading } = useQuery({
    queryKey: ["/api/earnings/dashboard", timeframe, operatorId],
    enabled: true,
  });

  const { data: breakdown = [] } = useQuery({
    queryKey: ["/api/earnings/breakdown", timeframe, operatorId],
    enabled: true,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" color="neon" />
      </div>
    );
  }

  const mockData: EarningsData = {
    totalEarnings: 45000, // $450
    matchCommissions: 25000, // $250
    membershipCommissions: 15000, // $150  
    escrowCommissions: 5000, // $50
    operatorShare: 20000, // $200
    platformShare: 25000, // $250
    currentMRR: 8500, // $85 MRR
    growthRate: 12.5,
  };

  const mockBreakdown: CommissionBreakdown[] = [
    {
      sourceType: "match_commission",
      amount: 25000,
      count: 47,
      averageCommission: 531,
    },
    {
      sourceType: "membership_commission",
      amount: 15000,
      count: 23,
      averageCommission: 652,
    },
    {
      sourceType: "escrow_commission",
      amount: 5000,
      count: 8,
      averageCommission: 625,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">💰 Earnings Dashboard</h1>
          <p className="text-gray-400">Platform and operator revenue tracking</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32" data-testid="select-timeframe">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" data-testid="button-export">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <EarningsStats data={mockData} />

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rates">Commission Rates</TabsTrigger>
          <TabsTrigger value="payouts">Operator Payouts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CommissionBreakdown breakdown={mockBreakdown} />

            <Card className="bg-black/60 backdrop-blur-sm border border-neon-green/20 shadow-felt">
              <CardHeader>
                <CardTitle className="text-white">Revenue Split</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-neon-green rounded"></div>
                      <span className="text-gray-300">Platform Share</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-neon-green">
                        ${(mockData.platformShare / 100).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-400">
                        {((mockData.platformShare / mockData.totalEarnings) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-blue-400 rounded"></div>
                      <span className="text-gray-300">Operator Share</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-400">
                        ${(mockData.operatorShare / 100).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-400">
                        {((mockData.operatorShare / mockData.totalEarnings) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-700">
                    <div className="text-sm text-gray-400 mb-2">Example: $100 Challenge Fee</div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Platform (10%):</span>
                        <span className="text-neon-green">$10</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Operator (6%):</span>
                        <span className="text-blue-400">$6</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Prize Pool:</span>
                        <span className="text-white">$84</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rates">
          <CommissionRates />
        </TabsContent>

        <TabsContent value="payouts">
          <Card className="bg-black/60 backdrop-blur-sm border border-neon-green/20 shadow-felt">
            <CardHeader>
              <CardTitle className="text-white">Operator Rewards Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Automated Monthly Rewards</h3>
                <p className="text-gray-400 max-w-md mx-auto">
                  Operator earnings are automatically calculated and distributed on the 1st of each month via Stripe transfers.
                </p>
                <Button className="mt-4" variant="outline" data-testid="button-rewards-history">
                  View Rewards History
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}