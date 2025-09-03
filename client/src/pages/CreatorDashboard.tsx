import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Users, DollarSign, AlertTriangle, Settings, BarChart3, Shield } from "lucide-react";
import SafeText from "@/components/SafeText";

export default function CreatorDashboard() {
  const { data: globalStats } = useQuery({
    queryKey: ["/api/admin/global-stats"],
    retry: false,
  });

  const { data: operators } = useQuery({
    queryKey: ["/api/admin/operators"],
    retry: false,
  });

  const { data: disputes } = useQuery({
    queryKey: ["/api/admin/disputes"],
    retry: false,
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-felt-green/10 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center">
          <Crown className="mr-3 text-yellow-400" />
          Creator Dashboard
        </h1>
        <p className="text-gray-400 mt-2">Global platform oversight and management</p>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-black/60 backdrop-blur-sm border border-neon-green/30 shadow-felt">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Players</CardTitle>
            <Users className="h-4 w-4 text-neon-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{globalStats?.totalPlayers || 0}</div>
            <p className="text-xs text-gray-400">Across all halls</p>
          </CardContent>
        </Card>

        <Card className="bg-black/60 backdrop-blur-sm border border-blue-500/30 shadow-felt">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Active Operators</CardTitle>
            <Shield className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{globalStats?.activeOperators || 0}</div>
            <p className="text-xs text-gray-400">Pool halls operating</p>
          </CardContent>
        </Card>

        <Card className="bg-black/60 backdrop-blur-sm border border-dollar-green/30 shadow-felt">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-dollar-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${globalStats?.monthlyRevenue || 0}</div>
            <p className="text-xs text-gray-400">Subscription + fees</p>
          </CardContent>
        </Card>

        <Card className="bg-black/60 backdrop-blur-sm border border-red-500/30 shadow-felt">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Open Disputes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{disputes?.length || 0}</div>
            <p className="text-xs text-gray-400">Require review</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Operator Management */}
        <Card className="bg-black/60 backdrop-blur-sm border border-blue-500/30 shadow-felt">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white flex items-center">
              <Shield className="mr-3 text-blue-400" />
              Operator Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                data-testid="button-review-operators"
              >
                Review Pending Operators
              </Button>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                data-testid="button-manage-subscriptions"
              >
                Manage Subscriptions
              </Button>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                data-testid="button-grant-free-months"
              >
                Grant Free Months
              </Button>
            </div>
            <div className="bg-blue-900/20 border border-blue-600/30 rounded p-3">
              <div className="text-sm text-blue-300">Pending Approvals: {operators?.pending || 0}</div>
              <div className="text-xs text-blue-400">Monthly recurring: ${globalStats?.monthlyRecurring || 0}</div>
            </div>
          </CardContent>
        </Card>

        {/* Dispute Resolution */}
        <Card className="bg-black/60 backdrop-blur-sm border border-red-500/30 shadow-felt">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white flex items-center">
              <AlertTriangle className="mr-3 text-red-400" />
              Dispute Resolution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button 
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                data-testid="button-review-disputes"
              >
                Review Open Disputes
              </Button>
              <Button 
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                data-testid="button-escalated-issues"
              >
                Escalated Issues
              </Button>
              <Button 
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                data-testid="button-ban-management"
              >
                Ban Management
              </Button>
            </div>
            <div className="bg-red-900/20 border border-red-600/30 rounded p-3">
              <div className="text-sm text-red-300">Urgent: {disputes?.urgent || 0}</div>
              <div className="text-xs text-red-400">Avg resolution: 4.2 hours</div>
            </div>
          </CardContent>
        </Card>

        {/* Platform Controls */}
        <Card className="bg-black/60 backdrop-blur-sm border border-amber-500/30 shadow-felt">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white flex items-center">
              <Settings className="mr-3 text-amber-400" />
              Platform Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button 
                className="w-full bg-amber-600 hover:bg-amber-700 text-black"
                data-testid="button-game-rules"
              >
                Game Rules & Settings
              </Button>
              <Button 
                className="w-full bg-amber-600 hover:bg-amber-700 text-black"
                data-testid="button-pricing-controls"
              >
                Pricing Controls
              </Button>
              <Button 
                className="w-full bg-amber-600 hover:bg-amber-700 text-black"
                data-testid="button-create-owner"
              >
                Create Owner Account
              </Button>
            </div>
            <div className="bg-amber-900/20 border border-amber-600/30 rounded p-3">
              <div className="text-sm text-amber-300">System: Healthy</div>
              <div className="text-xs text-amber-400">Last update: 2 hours ago</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Overview */}
      <Card className="mt-6 bg-black/60 backdrop-blur-sm border border-dollar-green/30 shadow-felt">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white flex items-center">
            <BarChart3 className="mr-3 text-dollar-green" />
            Financial Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-dollar-green">${globalStats?.subscriptionRevenue || 0}</div>
              <div className="text-sm text-gray-400">Subscription Revenue</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-neon-green">${globalStats?.challengeFees || 0}</div>
              <div className="text-sm text-gray-400">Challenge Fees</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">${globalStats?.operatorPayouts || 0}</div>
              <div className="text-sm text-gray-400">Operator Payouts</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-400">${globalStats?.netProfit || 0}</div>
              <div className="text-sm text-gray-400">Net Profit</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}