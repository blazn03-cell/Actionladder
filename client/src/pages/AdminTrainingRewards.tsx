import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Award, TrendingUp, DollarSign, Users, Download, Search, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { SelectSubscriptionReward, SelectLadderTrainingScore } from "@shared/schema";

interface RewardHistoryItem extends SelectSubscriptionReward {
  playerName?: string;
  hallName?: string;
}

export default function AdminTrainingRewards() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedHall, setSelectedHall] = useState<string>("all");
  const [showConfirm, setShowConfirm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "applied" | "pending">("all");
  const [page, setPage] = useState(1);
  const perPage = 20;

  // Check admin access
  const isAdmin = user?.globalRole === "OWNER" || user?.globalRole === "STAFF" || user?.globalRole === "OPERATOR";

  // Month options for the last 12 months
  const monthOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      options.push({ value, label });
    }
    return options;
  }, []);

  // Fetch halls
  const { data: hallsData } = useQuery<{ halls: any[] }>({
    queryKey: ["/api/halls"],
  });

  const halls = hallsData?.halls || [];

  // Fetch leaderboard for preview
  const { data: leaderboard, isLoading: isLoadingLeaderboard } = useQuery<SelectLadderTrainingScore[]>({
    queryKey: [`/api/training/hall/${selectedHall}/leaderboard?period=${selectedMonth}`],
    enabled: selectedHall !== "all",
  });

  // Fetch reward history
  const { data: rewardHistory, isLoading: isLoadingHistory } = useQuery<RewardHistoryItem[]>({
    queryKey: [`/api/training/rewards/history?hallId=${selectedHall || ''}&period=${selectedMonth}&status=${statusFilter || ''}`],
  });

  // Fetch players for name lookup
  const { data: players } = useQuery<any[]>({
    queryKey: ["/api/players"],
  });

  // Apply rewards mutation
  const applyRewardsMutation = useMutation({
    mutationFn: () => apiRequest("/api/training/rewards/monthly", {
      method: "POST",
      body: JSON.stringify({ hallId: selectedHall === "all" ? undefined : selectedHall, period: selectedMonth })
    }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ predicate: (query) => {
        const key = query.queryKey[0]?.toString() || '';
        return key.includes('/api/training/rewards/history') || key.includes('/api/training/hall');
      }});
      toast({ 
        title: "✅ Rewards Applied Successfully",
        description: `${data.applied || 0} rewards applied, ${data.failed || 0} failed`,
      });
      setShowConfirm(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "❌ Error Applying Rewards",
        description: error.message || "Failed to apply rewards",
        variant: "destructive"
      });
    }
  });

  // Filter and paginate history
  const filteredHistory = useMemo(() => {
    if (!rewardHistory) return [];
    
    let filtered = rewardHistory;
    
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.playerName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(item => 
        statusFilter === "applied" ? item.appliedToStripe : !item.appliedToStripe
      );
    }
    
    return filtered;
  }, [rewardHistory, searchTerm, statusFilter]);

  const paginatedHistory = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredHistory.slice(start, start + perPage);
  }, [filteredHistory, page]);

  const totalPages = Math.ceil(filteredHistory.length / perPage);

  // Statistics calculations
  const stats = useMemo(() => {
    if (!rewardHistory) return { total: 0, totalValue: 0, avgCoachScore: 0, redemptionRate: 0 };
    
    const total = rewardHistory.length;
    const applied = rewardHistory.filter(r => r.appliedToStripe).length;
    const totalValue = rewardHistory.reduce((sum, r) => {
      const discount = r.rewardType === "free" ? 100 : 50;
      const monthlyPrice = 2500; // Assume $25/month average
      return sum + (monthlyPrice * discount / 100);
    }, 0);
    
    const avgCoachScore = leaderboard && leaderboard.length > 0
      ? leaderboard.slice(0, 10).reduce((sum, s) => sum + s.coachAvg, 0) / Math.min(leaderboard.length, 10)
      : 0;
    
    const redemptionRate = total > 0 ? (applied / total) * 100 : 0;
    
    return { total, totalValue, avgCoachScore, redemptionRate };
  }, [rewardHistory, leaderboard]);

  // Export to CSV
  const exportToCSV = () => {
    if (!filteredHistory.length) return;
    
    const headers = ["Period", "Hall", "Player", "Discount %", "Coupon ID", "Applied Status", "Applied Date"];
    const rows = filteredHistory.map(item => [
      item.period,
      item.hallName || item.hallId,
      item.playerName || item.playerId,
      item.rewardType === "free" ? "100%" : "50%",
      item.stripeCouponId || "N/A",
      item.appliedToStripe ? "Applied" : "Pending",
      item.appliedDate ? new Date(item.appliedDate).toLocaleDateString() : "N/A"
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `training-rewards-${selectedMonth}.csv`;
    a.click();
  };

  const getPlayerName = (playerId: string) => {
    const player = players?.find(p => p.id === playerId);
    return player?.name || playerId;
  };

  const getHallName = (hallId: string) => {
    const hall = halls.find(h => h.id === hallId);
    return hall?.name || hallId;
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Card className="bg-gray-800 border-red-600">
          <CardHeader>
            <CardTitle className="text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-6 w-6" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300">You do not have permission to access this page. Admin access required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-green-400 mb-2" data-testid="page-title">
            Training Rewards Dashboard
          </h1>
          <p className="text-gray-400">Manage and monitor monthly training reward distribution</p>
        </div>

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gray-800 border-green-600/30" data-testid="card-stats-total">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                <Award className="h-4 w-4" />
                Total Rewards Issued
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-400" data-testid="text-total-rewards">{stats.total}</p>
              <p className="text-xs text-gray-500">Current month</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-green-600/30" data-testid="card-stats-value">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Discount Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-400" data-testid="text-total-value">
                ${(stats.totalValue / 100).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">USD</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-green-600/30" data-testid="card-stats-coach">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Avg Coach Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-400" data-testid="text-avg-score">
                {stats.avgCoachScore.toFixed(1)}
              </p>
              <p className="text-xs text-gray-500">Top 10 trainers</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-green-600/30" data-testid="card-stats-redemption">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Redemption Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-400" data-testid="text-redemption-rate">
                {stats.redemptionRate.toFixed(0)}%
              </p>
              <p className="text-xs text-gray-500">Applied / Created</p>
            </CardContent>
          </Card>
        </div>

        {/* Manual Reward Trigger Section */}
        <Card className="bg-gray-800 border-red-600/50" data-testid="card-trigger">
          <CardHeader className="border-b border-red-600/30">
            <CardTitle className="text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone: Manual Reward Trigger
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Month
                </label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white" data-testid="select-month">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {monthOptions.map(option => (
                      <SelectItem key={option.value} value={option.value} className="text-white hover:bg-gray-600">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Hall
                </label>
                <Select value={selectedHall} onValueChange={setSelectedHall}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white" data-testid="select-hall">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="all" className="text-white hover:bg-gray-600">All Halls</SelectItem>
                    {halls.map(hall => (
                      <SelectItem key={hall.id} value={hall.id} className="text-white hover:bg-gray-600">
                        {hall.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={() => setShowConfirm(true)}
                  disabled={applyRewardsMutation.isPending}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  data-testid="button-apply-rewards"
                >
                  {applyRewardsMutation.isPending ? "Processing..." : "Calculate & Apply Rewards"}
                </Button>
              </div>
            </div>

            <p className="text-sm text-gray-400">
              ⚠️ This will create Stripe coupons and apply them to player subscriptions based on training performance.
            </p>
          </CardContent>
        </Card>

        {/* Winner Preview */}
        {selectedHall !== "all" && (
          <Card className="bg-gray-800 border-green-600/30" data-testid="card-preview">
            <CardHeader>
              <CardTitle className="text-green-400">Winner Preview - {selectedMonth}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingLeaderboard ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full bg-gray-700" />
                  <Skeleton className="h-16 w-full bg-gray-700" />
                </div>
              ) : leaderboard && leaderboard.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-green-600/30">
                        <TableHead className="text-gray-400">Rank</TableHead>
                        <TableHead className="text-gray-400">Player</TableHead>
                        <TableHead className="text-gray-400">Score</TableHead>
                        <TableHead className="text-gray-400">Eligible Discount</TableHead>
                        <TableHead className="text-gray-400">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaderboard.slice(0, 3).map((entry, index) => (
                        <TableRow key={entry.id} className="border-green-600/20" data-testid={`row-winner-${index}`}>
                          <TableCell className="text-white font-bold">#{entry.rank}</TableCell>
                          <TableCell className="text-white">{getPlayerName(entry.playerId)}</TableCell>
                          <TableCell className="text-green-400 font-bold">{entry.totalScore.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge className={entry.rank === 1 ? "bg-green-600" : "bg-green-600/50"}>
                              {entry.rank === 1 ? "100%" : "50%"} OFF
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {entry.isWinner ? (
                              <Badge className="bg-green-600" data-testid={`badge-winner-${index}`}>
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Winner
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-400">Eligible</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8" data-testid="empty-preview">
                  No training data available for this period. Players need to log training sessions.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Reward History Table */}
        <Card className="bg-gray-800 border-green-600/30" data-testid="card-history">
          <CardHeader>
            <CardTitle className="text-green-400 flex items-center justify-between">
              <span>Reward History</span>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                disabled={!filteredHistory.length}
                className="bg-gray-700 border-green-600/30 text-green-400 hover:bg-gray-600"
                data-testid="button-export-csv"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by player name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-700 border-gray-600 text-white"
                  data-testid="input-search"
                />
              </div>

              <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white" data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="all" className="text-white hover:bg-gray-600">All Status</SelectItem>
                  <SelectItem value="applied" className="text-white hover:bg-gray-600">Applied</SelectItem>
                  <SelectItem value="pending" className="text-white hover:bg-gray-600">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            {isLoadingHistory ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full bg-gray-700" />
                ))}
              </div>
            ) : paginatedHistory.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-green-600/30">
                        <TableHead className="text-gray-400">Period</TableHead>
                        <TableHead className="text-gray-400">Hall</TableHead>
                        <TableHead className="text-gray-400">Player</TableHead>
                        <TableHead className="text-gray-400">Discount %</TableHead>
                        <TableHead className="text-gray-400">Coupon ID</TableHead>
                        <TableHead className="text-gray-400">Status</TableHead>
                        <TableHead className="text-gray-400">Applied Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedHistory.map((item, index) => (
                        <TableRow key={item.id} className="border-green-600/20" data-testid={`row-history-${index}`}>
                          <TableCell className="text-white">{item.period}</TableCell>
                          <TableCell className="text-white">{getHallName(item.hallId)}</TableCell>
                          <TableCell className="text-white">{getPlayerName(item.playerId)}</TableCell>
                          <TableCell>
                            <Badge className={item.rewardType === "free" ? "bg-green-600" : "bg-green-600/50"}>
                              {item.rewardType === "free" ? "100%" : "50%"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-400 font-mono text-xs">
                            {item.stripeCouponId || "N/A"}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={item.appliedToStripe ? "bg-green-600" : "bg-yellow-600"}
                              data-testid={`badge-status-${index}`}
                            >
                              {item.appliedToStripe ? "Applied" : "Pending"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-400">
                            {item.appliedDate ? new Date(item.appliedDate).toLocaleDateString() : "N/A"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="bg-gray-700 border-gray-600 text-white"
                      data-testid="button-prev-page"
                    >
                      Previous
                    </Button>
                    <span className="text-gray-400">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="bg-gray-700 border-gray-600 text-white"
                      data-testid="button-next-page"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-400 text-center py-8" data-testid="empty-history">
                No reward history found for the selected filters.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="bg-gray-800 border-red-600" data-testid="dialog-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400">
              Apply Rewards for {monthOptions.find(m => m.value === selectedMonth)?.label}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              This will create Stripe coupons and apply them to subscriptions for{" "}
              <span className="font-bold text-white">
                {selectedHall === "all" ? "all halls" : getHallName(selectedHall)}
              </span>
              . This action cannot be undone. Winners will receive their discount on their next billing cycle.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="bg-gray-700 text-white hover:bg-gray-600"
              data-testid="button-cancel-confirm"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => applyRewardsMutation.mutate()}
              className="bg-red-600 hover:bg-red-700 text-white"
              data-testid="button-confirm-apply"
            >
              Yes, Apply Rewards
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
