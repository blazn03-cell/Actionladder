import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Coins, TrendingUp, History, Plus } from "lucide-react";

interface Wallet {
  userId: string;
  balanceCredits: number;
  balanceLockedCredits: number;
  createdAt: string;
}

interface SidePot {
  id: string;
  matchId?: string;
  creatorId: string;
  sideALabel?: string;
  sideBLabel?: string;
  stakePerSide: number;
  feeBps: number;
  status: string;
  lockCutoffAt?: string;
  createdAt: string;
}

interface SideBet {
  id: string;
  sidePotId: string;
  userId: string;
  side?: string;
  amount: number;
  status: string;
  fundedAt?: string;
  createdAt: string;
}

interface LedgerEntry {
  id: string;
  userId: string;
  type?: string;
  amount?: number;
  refId?: string;
  metaJson?: string;
  createdAt?: string;
}

export default function SideBetting() {
  const [userId] = useState("user-123"); // This would come from auth context
  const [topUpAmount, setTopUpAmount] = useState("");
  const [newPotStake, setNewPotStake] = useState("");
  const [sideALabel, setSideALabel] = useState("");
  const [sideBLabel, setSideBLabel] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch wallet data
  const { data: wallet, isLoading: walletLoading } = useQuery<Wallet>({
    queryKey: ["/api/wallet", userId],
  });

  // Fetch side pots
  const { data: sidePots = [], isLoading: potsLoading } = useQuery<SidePot[]>({
    queryKey: ["/api/side-pots"],
  });

  // Fetch user's bets
  const { data: userBets = [], isLoading: betsLoading } = useQuery<SideBet[]>({
    queryKey: ["/api/side-bets/user", userId],
  });

  // Fetch transaction history
  const { data: ledger = [], isLoading: ledgerLoading } = useQuery<LedgerEntry[]>({
    queryKey: ["/api/wallet", userId, "ledger"],
  });

  // Wallet top-up mutation
  const topUpMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await apiRequest("POST", `/api/wallet/${userId}/topup`, { amount });
      
      // Simulate Stripe payment completion for demo
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return apiRequest("POST", `/api/wallet/${userId}/topup/complete`, { 
        paymentIntentId: `pi_demo_${Date.now()}`, 
        amount 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet", userId, "ledger"] });
      toast({
        title: "Wallet Topped Up",
        description: "Credits added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to top up wallet",
        variant: "destructive",
      });
    },
  });

  // Create side pot mutation
  const createPotMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/side-pots", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/side-pots"] });
      toast({
        title: "Match Pool Created",
        description: "Your pool is now accepting entries",
      });
      setNewPotStake("");
      setSideALabel("");
      setSideBLabel("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create side pot",
        variant: "destructive",
      });
    },
  });

  // Place bet mutation
  const placeBetMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/side-bets", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/side-bets/user", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/side-pots"] });
      toast({
        title: "Pool Entry Confirmed",
        description: "You're locked into the pool before the break",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to place bet",
        variant: "destructive",
      });
    },
  });

  const handleTopUp = () => {
    const amount = parseFloat(topUpAmount);
    if (amount >= 5) {
      topUpMutation.mutate(amount);
      setTopUpAmount("");
    }
  };

  const handleCreatePot = () => {
    const stake = parseFloat(newPotStake);
    if (stake >= 5 && stake <= 100000 && sideALabel && sideBLabel) {
      // Calculate service fee based on total pot
      const totalPot = stake * 2;
      const serviceFeePercent = totalPot > 500 ? 5 : 8.5;
      
      createPotMutation.mutate({
        creatorId: userId,
        sideALabel,
        sideBLabel,
        stakePerSide: stake * 100, // Convert to cents
        status: "open",
      });
    }
  };

  const calculateServiceFee = (stakePerSide: number) => {
    const totalPot = stakePerSide * 2;
    return totalPot > 500 ? 5 : 8.5;
  };

  const handlePlaceBet = (sidePotId: string, side: string, amount: number) => {
    placeBetMutation.mutate({
      sidePotId,
      userId,
      side,
      amount: amount * 100, // Convert to cents
    });
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  if (walletLoading || potsLoading || betsLoading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Match Pools</h1>
        <p className="text-green-400">Lock into the action before the break</p>
      </div>

      <Tabs defaultValue="wallet" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="wallet" data-testid="tab-wallet">
            <Coins className="mr-2 h-4 w-4" />
            Wallet
          </TabsTrigger>
          <TabsTrigger value="pots" data-testid="tab-side-pots">
            <TrendingUp className="mr-2 h-4 w-4" />
            Match Pools
          </TabsTrigger>
          <TabsTrigger value="bets" data-testid="tab-my-bets">My Entries</TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">
            <History className="mr-2 h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wallet" className="space-y-4">
          <Card data-testid="wallet-balance-card">
            <CardHeader>
              <CardTitle>Challenge Credits</CardTitle>
              <CardDescription>Your credits for joining match pools</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Available Credits</Label>
                  <div className="text-2xl font-bold text-green-400" data-testid="available-credits">
                    {formatCurrency(wallet?.balanceCredits || 0)}
                  </div>
                </div>
                <div>
                  <Label>Credits Locked Until Result</Label>
                  <div className="text-2xl font-bold text-yellow-400" data-testid="locked-credits">
                    {formatCurrency(wallet?.balanceLockedCredits || 0)}
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <Label htmlFor="topup-amount">Top Up Amount ($)</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="topup-amount"
                    data-testid="input-topup-amount"
                    type="number"
                    min="5"
                    step="1"
                    placeholder="Minimum $5"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                  />
                  <Button 
                    onClick={handleTopUp}
                    disabled={topUpMutation.isPending || parseFloat(topUpAmount) < 5}
                    data-testid="button-topup"
                  >
                    {topUpMutation.isPending ? "Processing..." : "Top Up"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pots" className="space-y-4">
          <Card data-testid="create-pot-card">
            <CardHeader>
              <CardTitle>
                <Plus className="mr-2 h-5 w-5 inline" />
                Create Match Pool
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="side-a-label">Side A Label</Label>
                  <Input
                    id="side-a-label"
                    data-testid="input-side-a-label"
                    placeholder="e.g., Player 1 Wins"
                    value={sideALabel}
                    onChange={(e) => setSideALabel(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="side-b-label">Side B Label</Label>
                  <Input
                    id="side-b-label"
                    data-testid="input-side-b-label"
                    placeholder="e.g., Player 2 Wins"
                    value={sideBLabel}
                    onChange={(e) => setSideBLabel(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="stake-amount">Entry Per Side ($5 - $100,000)</Label>
                {newPotStake && parseFloat(newPotStake) >= 5 && (
                  <div className="text-sm text-muted-foreground mt-1">
                    Service Fee: {calculateServiceFee(parseFloat(newPotStake))}% • Total Pot: ${(parseFloat(newPotStake) * 2).toLocaleString()}
                  </div>
                )}
                <div className="flex gap-2 mt-2">
                  <Input
                    id="stake-amount"
                    data-testid="input-stake-amount"
                    type="number"
                    min="5"
                    max="100000"
                    step="1"
                    placeholder="Entry amount per side"
                    value={newPotStake}
                    onChange={(e) => setNewPotStake(e.target.value)}
                  />
                  <Button 
                    onClick={handleCreatePot}
                    disabled={createPotMutation.isPending || !sideALabel || !sideBLabel || !newPotStake || parseFloat(newPotStake) < 5 || parseFloat(newPotStake) > 100000}
                    data-testid="button-create-pot"
                  >
                    {createPotMutation.isPending ? "Creating..." : "Create Pool"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {sidePots.map((pot) => (
              <Card key={pot.id} data-testid={`side-pot-${pot.id}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {pot.sideALabel} vs {pot.sideBLabel}
                      </CardTitle>
                      <CardDescription>
                        Entry: {formatCurrency(pot.stakePerSide)} per side • Service Fee: {(pot.feeBps / 100).toFixed(1)}%
                      </CardDescription>
                    </div>
                    <Badge variant={pot.status === "open" ? "default" : "secondary"} data-testid={`pot-status-${pot.id}`}>
                      {pot.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {pot.status === "open" && (
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => handlePlaceBet(pot.id, "A", pot.stakePerSide / 100)}
                        disabled={placeBetMutation.isPending}
                        data-testid={`button-bet-side-a-${pot.id}`}
                      >
                        Join {pot.sideALabel}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => handlePlaceBet(pot.id, "B", pot.stakePerSide / 100)}
                        disabled={placeBetMutation.isPending}
                        data-testid={`button-bet-side-b-${pot.id}`}
                      >
                        Join {pot.sideBLabel}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="bets" className="space-y-4">
          <Card data-testid="my-bets-card">
            <CardHeader>
              <CardTitle>My Pool Entries</CardTitle>
            </CardHeader>
            <CardContent>
              {userBets.length === 0 ? (
                <p className="text-muted-foreground" data-testid="no-bets-message">No pool entries</p>
              ) : (
                <div className="space-y-2">
                  {userBets.map((bet) => (
                    <div 
                      key={bet.id} 
                      className="flex justify-between items-center p-3 border rounded"
                      data-testid={`bet-${bet.id}`}
                    >
                      <div>
                        <div className="font-medium">Side {bet.side}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(bet.amount)}
                        </div>
                      </div>
                      <Badge variant={bet.status === "funded" ? "default" : "secondary"} data-testid={`bet-status-${bet.id}`}>
                        {bet.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card data-testid="transaction-history-card">
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              {ledgerLoading ? (
                <p>Loading transactions...</p>
              ) : ledger.length === 0 ? (
                <p className="text-muted-foreground" data-testid="no-transactions-message">No transactions</p>
              ) : (
                <div className="space-y-2">
                  {ledger.map((entry) => (
                    <div 
                      key={entry.id} 
                      className="flex justify-between items-center p-3 border rounded"
                      data-testid={`transaction-${entry.id}`}
                    >
                      <div>
                        <div className="font-medium">{entry.type}</div>
                        <div className="text-sm text-muted-foreground">
                          {entry.createdAt && new Date(entry.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className={`font-bold ${(entry.amount || 0) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {(entry.amount || 0) > 0 ? '+' : ''}{formatCurrency(entry.amount || 0)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}