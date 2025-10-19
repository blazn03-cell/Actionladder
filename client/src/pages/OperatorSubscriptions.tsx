import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Building2, 
  Calculator, 
  CreditCard, 
  Plus, 
  Users, 
  Layers,
  GraduationCap,
  Crown,
  DollarSign
} from "lucide-react";
import type { OperatorSubscription } from "@shared/schema";

export default function OperatorSubscriptions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateSubscriptionOpen, setIsCreateSubscriptionOpen] = useState(false);
  const [isPricingCalculatorOpen, setIsPricingCalculatorOpen] = useState(false);
  const [pricingInputs, setPricingInputs] = useState({
    playerCount: 10,
    extraLadders: 0,
    rookieModuleActive: false,
    rookiePassesActive: 0,
  });

  // Get all operator subscriptions
  const { data: subscriptions, isLoading: subscriptionsLoading } = useQuery({
    queryKey: ["/api/operator-subscriptions"],
  });

  // Get pricing calculation
  const { data: pricingCalculation } = useQuery({
    queryKey: ["/api/operator-subscriptions/calculate", pricingInputs],
    queryFn: () => apiRequest("/api/operator-subscriptions/calculate", {
      method: "POST",
      body: JSON.stringify(pricingInputs)
    }),
    enabled: isPricingCalculatorOpen,
  });

  // Create subscription mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: (subscriptionData: any) => 
      apiRequest("/api/operator-subscriptions", { method: "POST", body: JSON.stringify(subscriptionData) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/operator-subscriptions"] });
      setIsCreateSubscriptionOpen(false);
      toast({
        title: "Subscription Created",
        description: "Operator subscription has been set up successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create subscription",
        variant: "destructive",
      });
    },
  });

  const handleCreateSubscription = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const subscriptionData = {
      operatorId: formData.get("operatorId"),
      hallName: formData.get("hallName"),
      playerCount: parseInt(formData.get("playerCount") as string),
      extraLadders: parseInt(formData.get("extraLadders") as string) || 0,
      rookieModuleActive: formData.get("rookieModule") === "on",
      rookiePassesActive: parseInt(formData.get("rookiePasses") as string) || 0,
    };
    
    createSubscriptionMutation.mutate(subscriptionData);
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case "small": return "bg-green-600";
      case "medium": return "bg-blue-600";
      case "large": return "bg-purple-600";
      case "mega": return "bg-red-600";
      default: return "bg-gray-600";
    }
  };

  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toFixed(0)}`;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-green-400 mb-2">Operator Subscriptions</h1>
        <p className="text-gray-400">Manage pool hall subscriptions and pricing tiers</p>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 flex gap-4">
        <Dialog open={isCreateSubscriptionOpen} onOpenChange={setIsCreateSubscriptionOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700" data-testid="button-create-subscription">
              <Plus className="mr-2 h-4 w-4" />
              New Subscription
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-green-400">Create Operator Subscription</DialogTitle>
              <DialogDescription>
                Set up a new subscription for a pool hall operator
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSubscription} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="operatorId">Operator ID</Label>
                  <Input
                    id="operatorId"
                    name="operatorId"
                    required
                    placeholder="Enter operator user ID"
                    className="bg-gray-800 border-gray-600"
                    data-testid="input-operator-id"
                  />
                </div>
                <div>
                  <Label htmlFor="hallName">Hall Name</Label>
                  <Input
                    id="hallName"
                    name="hallName"
                    required
                    placeholder="Pool hall name"
                    className="bg-gray-800 border-gray-600"
                    data-testid="input-hall-name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="playerCount">Player Count</Label>
                  <Input
                    id="playerCount"
                    name="playerCount"
                    type="number"
                    min="1"
                    required
                    placeholder="Number of players"
                    className="bg-gray-800 border-gray-600"
                    data-testid="input-player-count"
                  />
                </div>
                <div>
                  <Label htmlFor="extraLadders">Extra Ladders</Label>
                  <Input
                    id="extraLadders"
                    name="extraLadders"
                    type="number"
                    min="0"
                    defaultValue="0"
                    placeholder="0"
                    className="bg-gray-800 border-gray-600"
                    data-testid="input-extra-ladders"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="rookieModule"
                    name="rookieModule"
                    className="w-4 h-4"
                    data-testid="checkbox-rookie-module"
                  />
                  <Label htmlFor="rookieModule" className="text-sm">
                    Enable Rookie Module (+$50/month)
                  </Label>
                </div>
                <div>
                  <Label htmlFor="rookiePasses">Rookie Passes</Label>
                  <Input
                    id="rookiePasses"
                    name="rookiePasses"
                    type="number"
                    min="0"
                    defaultValue="0"
                    placeholder="Number of rookie passes"
                    className="bg-gray-800 border-gray-600"
                    data-testid="input-rookie-passes"
                  />
                  <p className="text-xs text-gray-500 mt-1">$15/month per rookie pass</p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateSubscriptionOpen(false)}
                  data-testid="button-cancel-subscription"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createSubscriptionMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                  data-testid="button-submit-subscription"
                >
                  {createSubscriptionMutation.isPending ? "Creating..." : "Create Subscription"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isPricingCalculatorOpen} onOpenChange={setIsPricingCalculatorOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" data-testid="button-pricing-calculator">
              <Calculator className="mr-2 h-4 w-4" />
              Pricing Calculator
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-green-400">Subscription Pricing Calculator</DialogTitle>
              <DialogDescription>
                Calculate monthly costs based on hall size and add-ons
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="calc-players">Player Count</Label>
                  <Input
                    id="calc-players"
                    type="number"
                    min="1"
                    value={pricingInputs.playerCount}
                    onChange={(e) => setPricingInputs(prev => ({ 
                      ...prev, 
                      playerCount: parseInt(e.target.value) || 0 
                    }))}
                    className="bg-gray-800 border-gray-600"
                    data-testid="input-calc-players"
                  />
                </div>
                <div>
                  <Label htmlFor="calc-ladders">Extra Ladders</Label>
                  <Input
                    id="calc-ladders"
                    type="number"
                    min="0"
                    value={pricingInputs.extraLadders}
                    onChange={(e) => setPricingInputs(prev => ({ 
                      ...prev, 
                      extraLadders: parseInt(e.target.value) || 0 
                    }))}
                    className="bg-gray-800 border-gray-600"
                    data-testid="input-calc-ladders"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="calc-rookie-module"
                  checked={pricingInputs.rookieModuleActive}
                  onCheckedChange={(checked) => setPricingInputs(prev => ({ 
                    ...prev, 
                    rookieModuleActive: checked 
                  }))}
                  data-testid="switch-calc-rookie-module"
                />
                <Label htmlFor="calc-rookie-module">Rookie Module (+$50/mo)</Label>
              </div>
              <div>
                <Label htmlFor="calc-rookie-passes">Rookie Passes</Label>
                <Input
                  id="calc-rookie-passes"
                  type="number"
                  min="0"
                  value={pricingInputs.rookiePassesActive}
                  onChange={(e) => setPricingInputs(prev => ({ 
                    ...prev, 
                    rookiePassesActive: parseInt(e.target.value) || 0 
                  }))}
                  className="bg-gray-800 border-gray-600"
                  data-testid="input-calc-rookie-passes"
                />
              </div>

              {pricingCalculation && (
                <div className="mt-6 p-4 bg-green-900/20 border border-green-700 rounded">
                  <h3 className="font-semibold text-green-400 mb-3">Pricing Breakdown</h3>
                  <div className="space-y-2">
                    {(pricingCalculation as any).breakdown.map((item: string, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.split(":")[0]}</span>
                        <span className="font-mono">{item.split(":")[1]}</span>
                      </div>
                    ))}
                  </div>
                  <Separator className="my-3 bg-gray-700" />
                  <div className="flex justify-between font-bold text-green-400">
                    <span>Total Monthly:</span>
                    <span className="text-xl">{formatPrice((pricingCalculation as any).totalCost)}</span>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Subscriptions Grid */}
      {subscriptionsLoading ? (
        <div className="text-center py-8">
          <div className="text-gray-400">Loading subscriptions...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(subscriptions as OperatorSubscription[])?.map((subscription: OperatorSubscription) => (
            <SubscriptionCard key={subscription.id} subscription={subscription} />
          ))}
        </div>
      )}

      {(subscriptions as OperatorSubscription[])?.length === 0 && (
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="py-8 text-center">
            <Building2 className="mx-auto h-12 w-12 text-gray-500 mb-4" />
            <p className="text-gray-400 mb-4">No operator subscriptions found</p>
            <Button
              onClick={() => setIsCreateSubscriptionOpen(true)}
              className="bg-green-600 hover:bg-green-700"
              data-testid="button-create-first-subscription"
            >
              Create First Subscription
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SubscriptionCard({ subscription }: { subscription: OperatorSubscription }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const getTierInfo = (tier: string) => {
    const tierInfo = {
      small: { name: "Small Hall", color: "bg-green-600", limit: "≤15 players" },
      medium: { name: "Medium Hall", color: "bg-blue-600", limit: "16-25 players" },
      large: { name: "Large Hall", color: "bg-purple-600", limit: "26-40 players" },
      mega: { name: "Mega Hall", color: "bg-red-600", limit: "41+ players" },
    };
    return tierInfo[tier as keyof typeof tierInfo] || tierInfo.small;
  };

  const toggleStatusMutation = useMutation({
    mutationFn: (newStatus: string) => 
      apiRequest(`/api/operator-subscriptions/${subscription.operatorId}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/operator-subscriptions"] });
      toast({
        title: "Status Updated",
        description: `Subscription ${subscription.status === "active" ? "deactivated" : "activated"} successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update subscription status",
        variant: "destructive",
      });
    },
  });

  const handleToggleStatus = (checked: boolean) => {
    const newStatus = checked ? "active" : "inactive";
    toggleStatusMutation.mutate(newStatus);
  };

  const tierInfo = getTierInfo(subscription.tier);
  const isOverLimit = getPlayerOverage(subscription);
  const isActive = subscription.status === "active";

  return (
    <Card className="bg-gray-900 border-gray-700" data-testid={`card-subscription-${subscription.id}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-green-400 flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {subscription.hallName}
            </CardTitle>
            <CardDescription>{subscription.operatorId}</CardDescription>
          </div>
          <Badge className={tierInfo.color}>
            {tierInfo.name}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Main Pricing */}
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">
              {formatPrice(subscription.totalMonthlyCharge)}
            </div>
            <div className="text-sm text-gray-400">per month</div>
          </div>

          <Separator className="bg-gray-700" />

          {/* Subscription Details */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="flex items-center gap-1 text-gray-400">
                <Users className="h-4 w-4" />
                Players:
              </span>
              <span className={isOverLimit ? "text-yellow-400" : "text-white"}>
                {subscription.playerCount}
                {isOverLimit && ` (+${isOverLimit} extra)`}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-400">Base Tier:</span>
              <span>{tierInfo.limit}</span>
            </div>

            {(subscription.extraLadders || 0) > 0 && (
              <div className="flex justify-between">
                <span className="flex items-center gap-1 text-gray-400">
                  <Layers className="h-4 w-4" />
                  Extra Ladders:
                </span>
                <span className="text-purple-400">{subscription.extraLadders}</span>
              </div>
            )}

            {subscription.rookieModuleActive && (
              <div className="flex justify-between">
                <span className="flex items-center gap-1 text-gray-400">
                  <GraduationCap className="h-4 w-4" />
                  Rookie Module:
                </span>
                <span className="text-blue-400">Active</span>
              </div>
            )}

            {(subscription.rookiePassesActive || 0) > 0 && (
              <div className="flex justify-between">
                <span className="flex items-center gap-1 text-gray-400">
                  <Crown className="h-4 w-4" />
                  Rookie Passes:
                </span>
                <span className="text-yellow-400">{subscription.rookiePassesActive}</span>
              </div>
            )}
          </div>

          <Separator className="bg-gray-700" />

          {/* Subscription Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {isActive ? "Active" : "Inactive"}
              </span>
              <Badge 
                variant={isActive ? "default" : "destructive"}
                className={isActive ? "bg-green-600" : "bg-gray-600"}
              >
                {subscription.status}
              </Badge>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={handleToggleStatus}
              disabled={toggleStatusMutation.isPending}
              data-testid={`switch-subscription-status-${subscription.id}`}
            />
          </div>

          {/* Billing Info */}
          <div className="space-y-2 text-xs">
            
            {subscription.nextBillingDate && (
              <div className="flex justify-between">
                <span className="text-gray-400">Next Billing:</span>
                <span>{new Date(subscription.nextBillingDate).toLocaleDateString()}</span>
              </div>
            )}

            {subscription.stripeSubscriptionId && (
              <div className="flex justify-between">
                <span className="text-gray-400">Stripe ID:</span>
                <span className="font-mono text-xs">{subscription.stripeSubscriptionId.slice(0, 12)}...</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" data-testid={`button-edit-${subscription.id}`}>
              Edit
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-blue-400"
              data-testid={`button-billing-${subscription.id}`}
            >
              <CreditCard className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getPlayerOverage(subscription: OperatorSubscription): number {
  const tierLimits = { small: 15, medium: 25, large: 40, mega: 999 };
  const limit = tierLimits[subscription.tier as keyof typeof tierLimits] || 15;
  return Math.max(0, subscription.playerCount - limit);
}

function formatPrice(priceInCents: number): string {
  return `$${(priceInCents / 100).toFixed(0)}`;
}