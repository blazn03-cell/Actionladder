import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Gavel, TrendingUp, Users, AlertTriangle } from "lucide-react";

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

interface Resolution {
  id: string;
  sidePotId: string;
  winnerSide?: string;
  decidedBy: string;
  decidedAt: string;
  notes?: string;
}

interface PotDetails {
  pot: SidePot;
  bets: SideBet[];
  resolution?: Resolution;
}

export default function SideBetOperator() {
  const [operatorId] = useState("operator-123"); // This would come from auth context
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [selectedPot, setSelectedPot] = useState<string | null>(null);
  const [selectedWinner, setSelectedWinner] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all side pots
  const { data: sidePots = [], isLoading: potsLoading } = useQuery<SidePot[]>({
    queryKey: ["/api/side-pots"],
  });

  // Fetch pot details for selected pot
  const { data: potDetails } = useQuery<PotDetails>({
    queryKey: ["/api/side-pots", selectedPot, "details"],
    queryFn: () => apiRequest(`/api/side-pots/${selectedPot}/details`),
    enabled: !!selectedPot,
  });

  // Resolve side pot mutation
  const resolvePotMutation = useMutation({
    mutationFn: (data: { sidePotId: string; winnerSide: string; notes: string }) => 
      apiRequest(`/api/side-pots/${data.sidePotId}/resolve`, {
        method: "POST",
        body: JSON.stringify({
          winnerSide: data.winnerSide,
          decidedBy: operatorId,
          notes: data.notes,
        }),
      }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/side-pots"] });
      queryClient.invalidateQueries({ queryKey: ["/api/side-pots", selectedPot, "details"] });
      toast({
        title: "Side Pot Resolved",
        description: `Pot resolved with ${data.winners} winners and ${data.losers} losers. Total pot: ${formatCurrency(data.totalPot)}, Service Fee: ${formatCurrency(data.serviceFee)}`,
      });
      setSelectedPot(null);
      setSelectedWinner("");
      setResolutionNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to resolve side pot",
        variant: "destructive",
      });
    },
  });

  // Lock side pot mutation
  const lockPotMutation = useMutation({
    mutationFn: (potId: string) => 
      apiRequest(`/api/side-pots/${potId}`, {
        method: "PUT",
        body: JSON.stringify({ status: "locked" }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/side-pots"] });
      toast({
        title: "Side Pot Locked",
        description: "No more bets can be placed on this pot",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to lock side pot",
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const openPots = sidePots.filter(pot => pot.status === "open");
  const lockedPots = sidePots.filter(pot => pot.status === "locked");
  const resolvedPots = sidePots.filter(pot => pot.status === "resolved");

  const handleResolvePot = () => {
    if (selectedPot && selectedWinner && potDetails) {
      resolvePotMutation.mutate({
        sidePotId: selectedPot,
        winnerSide: selectedWinner,
        notes: resolutionNotes,
      });
    }
  };

  if (potsLoading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Side Bet Operations</h1>
        <p className="text-green-400">Manage side betting and pot resolutions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card data-testid="stats-open-pots">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Pots</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{openPots.length}</div>
            <p className="text-xs text-muted-foreground">Accepting bets</p>
          </CardContent>
        </Card>

        <Card data-testid="stats-locked-pots">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Locked Pots</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{lockedPots.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting resolution</p>
          </CardContent>
        </Card>

        <Card data-testid="stats-resolved-pots">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Pots</CardTitle>
            <Gavel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-400">{resolvedPots.length}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="open" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="open" data-testid="tab-open-pots">Open Pots</TabsTrigger>
          <TabsTrigger value="locked" data-testid="tab-locked-pots">Locked Pots</TabsTrigger>
          <TabsTrigger value="resolved" data-testid="tab-resolved-pots">Resolved Pots</TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="space-y-4">
          <div className="grid gap-4">
            {openPots.length === 0 ? (
              <p className="text-muted-foreground text-center py-8" data-testid="no-open-pots">
                No open pots
              </p>
            ) : (
              openPots.map((pot) => (
                <Card key={pot.id} data-testid={`open-pot-${pot.id}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {pot.sideALabel} vs {pot.sideBLabel}
                        </CardTitle>
                        <CardDescription>
                          Stake: {formatCurrency(pot.stakePerSide)} • Service Fee: {(pot.feeBps / 100).toFixed(1)}%
                        </CardDescription>
                        <div className="text-sm text-muted-foreground">
                          Created: {new Date(pot.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <Badge variant="default">Open</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => lockPotMutation.mutate(pot.id)}
                        disabled={lockPotMutation.isPending}
                        data-testid={`button-lock-pot-${pot.id}`}
                      >
                        Lock Pot
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedPot(pot.id)}
                        data-testid={`button-view-details-${pot.id}`}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="locked" className="space-y-4">
          <div className="grid gap-4">
            {lockedPots.length === 0 ? (
              <p className="text-muted-foreground text-center py-8" data-testid="no-locked-pots">
                No locked pots
              </p>
            ) : (
              lockedPots.map((pot) => (
                <Card key={pot.id} data-testid={`locked-pot-${pot.id}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {pot.sideALabel} vs {pot.sideBLabel}
                        </CardTitle>
                        <CardDescription>
                          Stake: {formatCurrency(pot.stakePerSide)} • Service Fee: {(pot.feeBps / 100).toFixed(1)}%
                        </CardDescription>
                      </div>
                      <Badge variant="secondary">Locked</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="default"
                            size="sm"
                            onClick={() => setSelectedPot(pot.id)}
                            data-testid={`button-resolve-pot-${pot.id}`}
                          >
                            <Gavel className="mr-2 h-4 w-4" />
                            Resolve Pot
                          </Button>
                        </DialogTrigger>
                        <DialogContent data-testid={`resolve-dialog-${pot.id}`}>
                          <DialogHeader>
                            <DialogTitle>Resolve Side Pot</DialogTitle>
                          </DialogHeader>
                          
                          {potDetails && (
                            <div className="space-y-4">
                              <div>
                                <h3 className="font-semibold mb-2">Pot Details</h3>
                                <p>{potDetails.pot.sideALabel} vs {potDetails.pot.sideBLabel}</p>
                                <p className="text-sm text-muted-foreground">
                                  Total Bets: {potDetails.bets.length} • 
                                  Total Amount: {formatCurrency(potDetails.bets.reduce((sum, bet) => sum + bet.amount, 0))}
                                </p>
                              </div>

                              <div>
                                <h3 className="font-semibold mb-2">Bet Distribution</h3>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="font-medium">Side A: {potDetails.pot.sideALabel}</p>
                                    <p className="text-sm">
                                      {potDetails.bets.filter(bet => bet.side === "A").length} bets • 
                                      {formatCurrency(potDetails.bets.filter(bet => bet.side === "A").reduce((sum, bet) => sum + bet.amount, 0))}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-medium">Side B: {potDetails.pot.sideBLabel}</p>
                                    <p className="text-sm">
                                      {potDetails.bets.filter(bet => bet.side === "B").length} bets • 
                                      {formatCurrency(potDetails.bets.filter(bet => bet.side === "B").reduce((sum, bet) => sum + bet.amount, 0))}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <Label htmlFor="winner-selection">Select Winner</Label>
                                <Select value={selectedWinner} onValueChange={setSelectedWinner}>
                                  <SelectTrigger data-testid="select-winner">
                                    <SelectValue placeholder="Choose winning side" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="A">{potDetails.pot.sideALabel}</SelectItem>
                                    <SelectItem value="B">{potDetails.pot.sideBLabel}</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label htmlFor="resolution-notes">Resolution Notes (Optional)</Label>
                                <Textarea
                                  id="resolution-notes"
                                  data-testid="textarea-resolution-notes"
                                  placeholder="Add any notes about the resolution..."
                                  value={resolutionNotes}
                                  onChange={(e) => setResolutionNotes(e.target.value)}
                                />
                              </div>

                              <Button 
                                onClick={handleResolvePot}
                                disabled={!selectedWinner || resolvePotMutation.isPending}
                                className="w-full"
                                data-testid="button-confirm-resolution"
                              >
                                {resolvePotMutation.isPending ? "Resolving..." : "Confirm Resolution"}
                              </Button>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedPot(pot.id)}
                        data-testid={`button-view-locked-details-${pot.id}`}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          <div className="grid gap-4">
            {resolvedPots.length === 0 ? (
              <p className="text-muted-foreground text-center py-8" data-testid="no-resolved-pots">
                No resolved pots
              </p>
            ) : (
              resolvedPots.map((pot) => (
                <Card key={pot.id} data-testid={`resolved-pot-${pot.id}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {pot.sideALabel} vs {pot.sideBLabel}
                        </CardTitle>
                        <CardDescription>
                          Stake: {formatCurrency(pot.stakePerSide)} • Service Fee: {(pot.feeBps / 100).toFixed(1)}%
                        </CardDescription>
                      </div>
                      <Badge variant="outline">Resolved</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedPot(pot.id)}
                      data-testid={`button-view-resolved-details-${pot.id}`}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}