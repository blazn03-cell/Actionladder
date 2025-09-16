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
import { Gavel, TrendingUp, Users, AlertTriangle, Pause, Ban, CheckCircle } from "lucide-react";

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
  description?: string;
  betType?: string;
  evidenceJson?: string;
  verificationSource?: string;
  createdAt: string;
}

interface SideBet {
  id: string;
  challengePoolId: string;
  userId: string;
  side?: string;
  amount: number;
  status: string;
  fundedAt?: string;
  createdAt: string;
}

interface Resolution {
  id: string;
  challengePoolId: string;
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
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [evidenceTimestamp, setEvidenceTimestamp] = useState("");
  const [evidenceNotes, setEvidenceNotes] = useState("");
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
    mutationFn: (data: { challengePoolId: string; winnerSide: string; notes: string }) => 
      apiRequest(`/api/side-pots/${data.challengePoolId}/resolve`, {
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
        description: `Winner receives the pot minus service fee. ${data.winners} winners, ${data.losers} losers. Total pot: ${formatCurrency(data.totalPot)}, Service Fee: ${formatCurrency(data.serviceFee)}`,
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
        description: "The pool is locked once both sides are in",
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

  // Hold side pot mutation
  const holdPotMutation = useMutation({
    mutationFn: (data: { potId: string; reason: string; evidence: any }) => 
      apiRequest(`/api/side-pots/${data.potId}/hold`, {
        method: "POST",
        body: JSON.stringify({
          reason: data.reason,
          evidence: data.evidence,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/side-pots"] });
      toast({
        title: "Side Pot On Hold",
        description: "Evidence requested. Your credits are locked until result.",
      });
      setSelectedPot(null);
      setResolutionNotes("");
      setEvidenceUrl("");
      setEvidenceTimestamp("");
      setEvidenceNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to put pool on hold",
        variant: "destructive",
      });
    },
  });

  // Void side pot mutation
  const voidPotMutation = useMutation({
    mutationFn: (data: { potId: string; reason: string }) => 
      apiRequest(`/api/side-pots/${data.potId}/void`, {
        method: "POST",
        body: JSON.stringify({
          reason: data.reason,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/side-pots"] });
      toast({
        title: "Side Pot Voided",
        description: "Your credits are locked until result - refund complete.",
      });
      setSelectedPot(null);
      setResolutionNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to void pool",
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
  const onHoldPots = sidePots.filter(pot => pot.status === "on_hold");
  const resolvedPots = sidePots.filter(pot => pot.status === "resolved");
  const voidedPots = sidePots.filter(pot => pot.status === "voided");

  const handleResolvePot = () => {
    if (selectedPot && selectedWinner && potDetails) {
      const evidence = {
        url: evidenceUrl.trim() || null,
        timestamp: evidenceTimestamp.trim() || null,
        notes: evidenceNotes.trim() || null,
      };

      resolvePotMutation.mutate({
        challengePoolId: selectedPot,
        winnerSide: selectedWinner,
        notes: resolutionNotes,
      });
    }
  };

  const handleHoldPot = (potId: string, reason: string) => {
    const evidence = {
      url: evidenceUrl.trim() || null,
      timestamp: evidenceTimestamp.trim() || null,
      notes: evidenceNotes.trim() || null,
    };

    holdPotMutation.mutate({
      potId,
      reason,
      evidence,
    });
  };

  const handleVoidPot = (potId: string, reason: string) => {
    voidPotMutation.mutate({
      potId,
      reason,
    });
  };

  if (potsLoading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Side Pot Operations</h1>
        <p className="text-green-400">Lock pots and resolve side results</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card data-testid="stats-open-pots">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{openPots.length}</div>
            <p className="text-xs text-muted-foreground">Funding window</p>
          </CardContent>
        </Card>

        <Card data-testid="stats-locked-pots">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Locked</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{lockedPots.length}</div>
            <p className="text-xs text-muted-foreground">Betting closed</p>
          </CardContent>
        </Card>

        <Card data-testid="stats-hold-pots">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hold</CardTitle>
            <Pause className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-400">{onHoldPots.length}</div>
            <p className="text-xs text-muted-foreground">Need evidence</p>
          </CardContent>
        </Card>

        <Card data-testid="stats-resolved-pots">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{resolvedPots.length}</div>
            <p className="text-xs text-muted-foreground">Credits released</p>
          </CardContent>
        </Card>

        <Card data-testid="stats-voided-pots">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Voided</CardTitle>
            <Ban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-400">{voidedPots.length}</div>
            <p className="text-xs text-muted-foreground">Refunded</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="locked" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="open" data-testid="tab-open-pots">Open ({openPots.length})</TabsTrigger>
          <TabsTrigger value="locked" data-testid="tab-locked-pots">Locked ({lockedPots.length})</TabsTrigger>
          <TabsTrigger value="hold" data-testid="tab-hold-pots">On Hold ({onHoldPots.length})</TabsTrigger>
          <TabsTrigger value="resolved" data-testid="tab-resolved-pots">Resolved ({resolvedPots.length})</TabsTrigger>
          <TabsTrigger value="voided" data-testid="tab-voided-pots">Voided ({voidedPots.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="space-y-4">
          <div className="grid gap-4">
            {openPots.length === 0 ? (
              <p className="text-muted-foreground text-center py-8" data-testid="no-open-pots">
                No open pools
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
                        Lock Side Pot
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
                No locked pools
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
                            Resolve Side Pot
                          </Button>
                        </DialogTrigger>
                        <DialogContent data-testid={`resolve-dialog-${pot.id}`}>
                          <DialogHeader>
                            <DialogTitle>Resolve Match Pool</DialogTitle>
                          </DialogHeader>

                          {potDetails && (
                            <div className="space-y-4">
                              <div>
                                <h3 className="font-semibold mb-2">Pool Details</h3>
                                <p>{potDetails.pot.sideALabel} vs {potDetails.pot.sideBLabel}</p>
                                <p className="text-sm text-muted-foreground">
                                  Total Entries: {potDetails.bets.length} • 
                                  Total Amount: {formatCurrency(potDetails.bets.reduce((sum, bet) => sum + bet.amount, 0))}
                                </p>
                              </div>

                              <div>
                                <h3 className="font-semibold mb-2">Entry Distribution</h3>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="font-medium">Side A: {potDetails.pot.sideALabel}</p>
                                    <p className="text-sm">
                                      {potDetails.bets.filter(bet => bet.side === "A").length} entries • 
                                      {formatCurrency(potDetails.bets.filter(bet => bet.side === "A").reduce((sum, bet) => sum + bet.amount, 0))}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-medium">Side B: {potDetails.pot.sideBLabel}</p>
                                    <p className="text-sm">
                                      {potDetails.bets.filter(bet => bet.side === "B").length} entries • 
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

                              <div className="border-t pt-4">
                                <h3 className="font-semibold mb-3">Evidence Tracking</h3>
                                <div className="space-y-3">
                                  <div>
                                    <Label htmlFor="evidence-url">Evidence URL (Stream/Screenshot)</Label>
                                    <Input
                                      id="evidence-url"
                                      data-testid="input-evidence-url"
                                      placeholder="https://... (stream link, image URL, etc.)"
                                      value={evidenceUrl}
                                      onChange={(e) => setEvidenceUrl(e.target.value)}
                                    />
                                  </div>

                                  <div>
                                    <Label htmlFor="evidence-timestamp">Evidence Timestamp</Label>
                                    <Input
                                      id="evidence-timestamp"
                                      data-testid="input-evidence-timestamp"
                                      placeholder="e.g., 2:15:30 in stream, Game 3, rack 5"
                                      value={evidenceTimestamp}
                                      onChange={(e) => setEvidenceTimestamp(e.target.value)}
                                    />
                                  </div>

                                  <div>
                                    <Label htmlFor="evidence-notes">Evidence Notes</Label>
                                    <Textarea
                                      id="evidence-notes"
                                      data-testid="textarea-evidence-notes"
                                      placeholder="Describe what the evidence shows..."
                                      value={evidenceNotes}
                                      onChange={(e) => setEvidenceNotes(e.target.value)}
                                      rows={2}
                                    />
                                  </div>
                                </div>
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

                              <div className="flex gap-2">
                                <Button 
                                  onClick={handleResolvePot}
                                  disabled={!selectedWinner || resolvePotMutation.isPending}
                                  className="flex-1"
                                  data-testid="button-confirm-resolution"
                                >
                                  {resolvePotMutation.isPending ? "Resolving..." : "Resolve & Pay Out"}
                                </Button>

                                <Button 
                                  variant="outline"
                                  onClick={() => handleHoldPot(selectedPot!, "Evidence requested for verification")}
                                  disabled={holdPotMutation.isPending}
                                  data-testid="button-hold-pot"
                                >
                                  <Pause className="mr-2 h-4 w-4" />
                                  Hold for Evidence
                                </Button>

                                <Button 
                                  variant="destructive"
                                  onClick={() => handleVoidPot(selectedPot!, "Cannot be verified objectively")}
                                  disabled={voidPotMutation.isPending}
                                  data-testid="button-void-pot"
                                >
                                  <Ban className="mr-2 h-4 w-4" />
                                  Void & Refund
                                </Button>
                              </div>
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

        <TabsContent value="hold" className="space-y-4">
          <div className="grid gap-4">
            {onHoldPots.length === 0 ? (
              <p className="text-muted-foreground text-center py-8" data-testid="no-hold-pots">
                No pools on hold
              </p>
            ) : (
              onHoldPots.map((pot) => (
                <Card key={pot.id} data-testid={`hold-pot-${pot.id}`}>
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
                          On Hold: Awaiting evidence verification
                        </div>
                      </div>
                      <Badge variant="outline" className="text-orange-600 border-orange-600">On Hold</Badge>
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
                            data-testid={`button-resolve-hold-pot-${pot.id}`}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Resolve with Evidence
                          </Button>
                        </DialogTrigger>
                        <DialogContent data-testid={`resolve-hold-dialog-${pot.id}`}>
                          <DialogHeader>
                            <DialogTitle>Resolve Pool on Hold</DialogTitle>
                          </DialogHeader>

                          {potDetails && (
                            <div className="space-y-4">
                              <div>
                                <h3 className="font-semibold mb-2">Pool Details</h3>
                                <p>{potDetails.pot.sideALabel} vs {potDetails.pot.sideBLabel}</p>
                                <p className="text-sm text-muted-foreground">
                                  On Hold - Evidence required for resolution
                                </p>
                              </div>

                              <div>
                                <Label htmlFor="winner-selection-hold">Select Winner</Label>
                                <Select value={selectedWinner} onValueChange={setSelectedWinner}>
                                  <SelectTrigger data-testid="select-winner-hold">
                                    <SelectValue placeholder="Choose winning side" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="A">{potDetails.pot.sideALabel}</SelectItem>
                                    <SelectItem value="B">{potDetails.pot.sideBLabel}</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="border-t pt-4">
                                <h3 className="font-semibold mb-3 text-orange-600">Evidence Required</h3>
                                <div className="space-y-3">
                                  <div>
                                    <Label htmlFor="evidence-url-hold">Evidence URL (Required)</Label>
                                    <Input
                                      id="evidence-url-hold"
                                      data-testid="input-evidence-url-hold"
                                      placeholder="https://... (stream link, image URL, etc.)"
                                      value={evidenceUrl}
                                      onChange={(e) => setEvidenceUrl(e.target.value)}
                                    />
                                  </div>

                                  <div>
                                    <Label htmlFor="evidence-timestamp-hold">Evidence Timestamp (Required)</Label>
                                    <Input
                                      id="evidence-timestamp-hold"
                                      data-testid="input-evidence-timestamp-hold"
                                      placeholder="e.g., 2:15:30 in stream, Game 3, rack 5"
                                      value={evidenceTimestamp}
                                      onChange={(e) => setEvidenceTimestamp(e.target.value)}
                                    />
                                  </div>

                                  <div>
                                    <Label htmlFor="evidence-notes-hold">Evidence Notes (Required)</Label>
                                    <Textarea
                                      id="evidence-notes-hold"
                                      data-testid="textarea-evidence-notes-hold"
                                      placeholder="Describe what the evidence shows..."
                                      value={evidenceNotes}
                                      onChange={(e) => setEvidenceNotes(e.target.value)}
                                      rows={2}
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <Button 
                                  onClick={handleResolvePot}
                                  disabled={!selectedWinner || !evidenceUrl.trim() || !evidenceTimestamp.trim() || !evidenceNotes.trim() || resolvePotMutation.isPending}
                                  className="flex-1"
                                  data-testid="button-confirm-resolution-hold"
                                >
                                  {resolvePotMutation.isPending ? "Resolving..." : "Resolve & Pay Out"}
                                </Button>

                                <Button 
                                  variant="destructive"
                                  onClick={() => handleVoidPot(selectedPot!, "Insufficient evidence to verify objectively")}
                                  disabled={voidPotMutation.isPending}
                                  data-testid="button-void-hold-pot"
                                >
                                  <Ban className="mr-2 h-4 w-4" />
                                  Void & Refund
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleVoidPot(pot.id, "Evidence not provided within 24 hours")}
                        disabled={voidPotMutation.isPending}
                        data-testid={`button-timeout-void-pot-${pot.id}`}
                      >
                        <Ban className="mr-2 h-4 w-4" />
                        Timeout Void
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
                No resolved pools
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

        <TabsContent value="voided" className="space-y-4">
          <div className="grid gap-4">
            {voidedPots.length === 0 ? (
              <p className="text-muted-foreground text-center py-8" data-testid="no-voided-pots">
                No voided pools
              </p>
            ) : (
              voidedPots.map((pot) => (
                <Card key={pot.id} data-testid={`voided-pot-${pot.id}`}>
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
                          {pot.description && <p className="text-xs">"{pot.description}"</p>}
                          <p className="mt-1">Voided: Credits refunded to all participants</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-gray-600 border-gray-600">Voided</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        <div>Bet Type: <span className="capitalize">{pot.betType?.replace('_', ' ') || 'Standard'}</span></div>
                        <div>Verification Source: {pot.verificationSource || 'N/A'}</div>
                        <div>Voided: {new Date(pot.createdAt).toLocaleString()}</div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedPot(pot.id)}
                        data-testid={`button-view-voided-details-${pot.id}`}
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
      </Tabs>
    </div>
  );
}