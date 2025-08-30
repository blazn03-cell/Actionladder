import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Users, DollarSign, Shield, TrendingUp } from "lucide-react";

interface User {
  id: string;
  email: string;
  name?: string;
  globalRole: string;
  payoutShareBps?: number;
  onboardingComplete: boolean;
  stripeConnectId?: string;
}

interface PayoutTransfer {
  id: string;
  invoiceId: string;
  stripeTransferId: string;
  amount: number;
  shareType: string;
  recipientName?: string;
  recipientEmail?: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [shareBps, setShareBps] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get staff members
  const { data: staffData, isLoading: loadingStaff } = useQuery({
    queryKey: ["/api/admin/staff"],
    enabled: true
  });

  // Get payout history
  const { data: payoutsData, isLoading: loadingPayouts } = useQuery({
    queryKey: ["/api/admin/payouts"],
    enabled: true
  });

  // Invite staff mutation
  const inviteStaffMutation = useMutation({
    mutationFn: async (data: { email: string; name: string; shareBps: number }) => {
      const response = await apiRequest("POST", "/api/admin/staff/invite", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Staff Invited Successfully",
        description: `Onboarding link generated. Share this with ${inviteEmail}: ${data.onboardingUrl}`,
      });
      setInviteEmail("");
      setInviteName("");
      setShareBps("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/staff"] });
    },
    onError: (error: any) => {
      toast({
        title: "Invitation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update share mutation
  const updateShareMutation = useMutation({
    mutationFn: async (data: { userId: string; shareBps: number }) => {
      const response = await apiRequest("POST", "/api/admin/staff/share", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Share Updated",
        description: "Payout percentage updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/staff"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleInviteStaff = () => {
    if (!inviteEmail || !shareBps) {
      toast({
        title: "Missing Information",
        description: "Please provide email and share percentage",
        variant: "destructive",
      });
      return;
    }

    const shareBpsNum = Number(shareBps);
    if (shareBpsNum <= 0 || shareBpsNum > 10000) {
      toast({
        title: "Invalid Share",
        description: "Share must be between 0.01% and 100%",
        variant: "destructive",
      });
      return;
    }

    inviteStaffMutation.mutate({
      email: inviteEmail,
      name: inviteName,
      shareBps: shareBpsNum,
    });
  };

  const staff: User[] = staffData?.staff || [];
  const transfers: PayoutTransfer[] = payoutsData?.transfers || [];

  // Calculate total payouts by user
  const payoutsByUser = transfers.reduce((acc: any, transfer: PayoutTransfer) => {
    if (!acc[transfer.recipientEmail || "Unknown"]) {
      acc[transfer.recipientEmail || "Unknown"] = 0;
    }
    acc[transfer.recipientEmail || "Unknown"] += transfer.amount;
    return acc;
  }, {});

  return (
    <div className="container mx-auto px-4 py-8" data-testid="admin-dashboard">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-green-400 mb-2">Admin Dashboard</h1>
        <p className="text-gray-300">Manage staff and automatic revenue splitting</p>
      </div>

      <Tabs defaultValue="staff" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-black/40">
          <TabsTrigger value="staff" className="data-[state=active]:bg-green-600">
            <Users className="w-4 h-4 mr-2" />
            Staff Management
          </TabsTrigger>
          <TabsTrigger value="payouts" className="data-[state=active]:bg-green-600">
            <DollarSign className="w-4 h-4 mr-2" />
            Payout History
          </TabsTrigger>
          <TabsTrigger value="overview" className="data-[state=active]:bg-green-600">
            <TrendingUp className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="staff" className="space-y-6">
          {/* Invite Staff Card */}
          <Card className="bg-black/60 border-green-600/30">
            <CardHeader>
              <CardTitle className="text-green-400 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Invite Trusted Staff
              </CardTitle>
              <CardDescription className="text-gray-300">
                Add trusted friends to receive automatic revenue splits from all payments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="invite-email">Email Address</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="friend@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="bg-black/40 border-green-600/50"
                    data-testid="input-invite-email"
                  />
                </div>
                <div>
                  <Label htmlFor="invite-name">Name (Optional)</Label>
                  <Input
                    id="invite-name"
                    placeholder="Friend's Name"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="bg-black/40 border-green-600/50"
                    data-testid="input-invite-name"
                  />
                </div>
                <div>
                  <Label htmlFor="share-bps">Share % (e.g. 3000 = 30%)</Label>
                  <Input
                    id="share-bps"
                    type="number"
                    placeholder="3000"
                    value={shareBps}
                    onChange={(e) => setShareBps(e.target.value)}
                    className="bg-black/40 border-green-600/50"
                    data-testid="input-share-bps"
                  />
                </div>
              </div>
              <Button
                onClick={handleInviteStaff}
                disabled={inviteStaffMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-black font-semibold"
                data-testid="button-invite-staff"
              >
                {inviteStaffMutation.isPending ? "Sending..." : "Invite & Generate Onboarding Link"}
              </Button>
            </CardContent>
          </Card>

          {/* Current Staff */}
          <Card className="bg-black/60 border-green-600/30">
            <CardHeader>
              <CardTitle className="text-green-400">Current Staff</CardTitle>
              <CardDescription className="text-gray-300">
                Your trusted team members receiving automatic payouts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingStaff ? (
                <p className="text-gray-400">Loading staff...</p>
              ) : staff.length === 0 ? (
                <p className="text-gray-400">No staff members yet. Invite your trusted friends above.</p>
              ) : (
                <div className="space-y-4">
                  {staff.map((member: User) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 bg-black/40 rounded-lg border border-green-600/20"
                      data-testid={`staff-member-${member.id}`}
                    >
                      <div>
                        <div className="font-semibold text-green-400">
                          {member.name || member.email}
                        </div>
                        <div className="text-sm text-gray-400">{member.email}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={member.globalRole === "OWNER" ? "default" : "secondary"}
                            className={
                              member.globalRole === "OWNER"
                                ? "bg-yellow-600 text-black"
                                : "bg-green-600 text-black"
                            }
                          >
                            {member.globalRole}
                          </Badge>
                          <Badge
                            variant={member.onboardingComplete ? "default" : "destructive"}
                            className={
                              member.onboardingComplete
                                ? "bg-green-600 text-black"
                                : "bg-red-600 text-white"
                            }
                          >
                            {member.onboardingComplete ? "Verified" : "Pending Verification"}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-400">
                          {((member.payoutShareBps || 0) / 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-400">Share</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-6">
          <Card className="bg-black/60 border-green-600/30">
            <CardHeader>
              <CardTitle className="text-green-400">Payout History</CardTitle>
              <CardDescription className="text-gray-300">
                Automatic revenue splits from all subscription payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPayouts ? (
                <p className="text-gray-400">Loading payouts...</p>
              ) : transfers.length === 0 ? (
                <p className="text-gray-400">No payouts yet. Payouts happen automatically when customers pay.</p>
              ) : (
                <div className="space-y-4">
                  {transfers.slice(0, 10).map((transfer: PayoutTransfer) => (
                    <div
                      key={transfer.id}
                      className="flex items-center justify-between p-4 bg-black/40 rounded-lg border border-green-600/20"
                      data-testid={`payout-${transfer.id}`}
                    >
                      <div>
                        <div className="font-semibold text-green-400">
                          {transfer.recipientName || transfer.recipientEmail}
                        </div>
                        <div className="text-sm text-gray-400">
                          Invoice: {transfer.invoiceId}
                        </div>
                        <div className="text-sm text-gray-400">
                          {new Date(transfer.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-400">
                          ${(transfer.amount / 100).toFixed(2)}
                        </div>
                        <Badge className="bg-green-600 text-black">
                          {transfer.shareType}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-black/60 border-green-600/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Total Staff</CardTitle>
                <Users className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400" data-testid="text-total-staff">
                  {staff.length}
                </div>
                <p className="text-xs text-gray-400">
                  Active revenue-sharing partners
                </p>
              </CardContent>
            </Card>

            <Card className="bg-black/60 border-green-600/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Total Payouts</CardTitle>
                <DollarSign className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400" data-testid="text-total-payouts">
                  ${(transfers.reduce((sum: number, t: PayoutTransfer) => sum + t.amount, 0) / 100).toFixed(2)}
                </div>
                <p className="text-xs text-gray-400">
                  All-time automatic payouts
                </p>
              </CardContent>
            </Card>

            <Card className="bg-black/60 border-green-600/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Revenue Share</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400" data-testid="text-revenue-share">
                  {((staff.reduce((sum: number, s: User) => sum + (s.payoutShareBps || 0), 0)) / 100).toFixed(1)}%
                </div>
                <p className="text-xs text-gray-400">
                  Total allocated to staff
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Split Breakdown */}
          <Card className="bg-black/60 border-green-600/30">
            <CardHeader>
              <CardTitle className="text-green-400">Revenue Split Configuration</CardTitle>
              <CardDescription className="text-gray-300">
                Current automatic payout allocation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {staff.map((member: User) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between py-2 border-b border-green-600/20 last:border-b-0"
                  >
                    <span className="text-gray-300">
                      {member.name || member.email} ({member.globalRole})
                    </span>
                    <span className="font-semibold text-green-400">
                      {((member.payoutShareBps || 0) / 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
                <div className="pt-2 border-t border-green-600/40">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-green-400">Platform Keeps</span>
                    <span className="text-green-400">
                      {(100 - (staff.reduce((sum: number, s: User) => sum + (s.payoutShareBps || 0), 0) / 100)).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}