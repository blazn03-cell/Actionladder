import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import HallBattlesAdmin from "@/components/hall-battles-admin";
import { Users, DollarSign, Shield, TrendingUp, Trophy, Settings, Gift } from "lucide-react";

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

interface OperatorSettings {
  id: string;
  operatorUserId: string;
  cityName: string;
  areaName: string;
  customBranding?: string;
  hasFreeMonths: boolean;
  freeMonthsCount: number;
  freeMonthsGrantedBy?: string;
  freeMonthsGrantedAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    name?: string;
    email: string;
  };
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

  // Get organizations
  const { data: orgData, isLoading: loadingOrgs } = useQuery({
    queryKey: ["/api/admin/organizations"],
    enabled: true
  });

  // Get operator settings
  const { data: operatorsData, isLoading: loadingOperators } = useQuery({
    queryKey: ["/api/admin/operators"],
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

  // Toggle free months mutation
  const toggleFreeMonthsMutation = useMutation({
    mutationFn: async (data: { operatorUserId: string; hasFreeMonths: boolean; freeMonthsCount?: number }) => {
      const response = await apiRequest("POST", `/api/admin/operators/${data.operatorUserId}/free-months`, {
        hasFreeMonths: data.hasFreeMonths,
        freeMonthsCount: data.freeMonthsCount
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Free Months Updated",
        description: "Operator free months status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/operators"] });
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

  const staff: User[] = (staffData as any)?.staff || [];
  const transfers: PayoutTransfer[] = (payoutsData as any)?.transfers || [];
  const organizations: any[] = (orgData as any)?.organizations || [];
  const operators: OperatorSettings[] = (operatorsData as any) || [];

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
        <TabsList className="grid w-full grid-cols-7 bg-black/40">
          <TabsTrigger value="staff" className="data-[state=active]:bg-green-600">
            <Users className="w-4 h-4 mr-2" />
            Staff Management
          </TabsTrigger>
          <TabsTrigger value="organizations" className="data-[state=active]:bg-green-600">
            <Shield className="w-4 h-4 mr-2" />
            Organizations
          </TabsTrigger>
          <TabsTrigger value="hall-battles" className="data-[state=active]:bg-green-600">
            <Trophy className="w-4 h-4 mr-2" />
            Hall Battles
          </TabsTrigger>
          <TabsTrigger value="payouts" className="data-[state=active]:bg-green-600">
            <DollarSign className="w-4 h-4 mr-2" />
            Payout History
          </TabsTrigger>
          <TabsTrigger value="overview" className="data-[state=active]:bg-green-600">
            <TrendingUp className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="operators" className="data-[state=active]:bg-green-600">
            <Settings className="w-4 h-4 mr-2" />
            Operators
          </TabsTrigger>
          <TabsTrigger value="free-months" className="data-[state=active]:bg-green-600">
            <Gift className="w-4 h-4 mr-2" />
            Free Months
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

        <TabsContent value="organizations" className="space-y-6">
          <Card className="bg-black/60 border-green-600/30">
            <CardHeader>
              <CardTitle className="text-green-400">Organization Management</CardTitle>
              <CardDescription className="text-gray-300">
                Manage customer subscriptions and seat allocations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingOrgs ? (
                <p className="text-gray-400">Loading organizations...</p>
              ) : organizations.length === 0 ? (
                <p className="text-gray-400">No organizations found.</p>
              ) : (
                <div className="space-y-4">
                  {organizations.map((org: any) => (
                    <OrganizationCard key={org.id} organization={org} onUpdate={() => {
                      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
                    }} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hall-battles" className="space-y-6">
          <HallBattlesAdmin />
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
        {/* Operators Tab */}
        <TabsContent value="operators" className="space-y-6">
          <Card className="bg-black/60 border-green-600/30">
            <CardHeader>
              <CardTitle className="text-green-400 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Operator Management
              </CardTitle>
              <CardDescription className="text-gray-300">
                View and manage all operators in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingOperators ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-gray-400 mt-2">Loading operators...</p>
                </div>
              ) : operators.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No operators found</p>
              ) : (
                <div className="space-y-4">
                  {operators.map((operator) => (
                    <div key={operator.id} className="bg-black/40 rounded-lg p-4 border border-green-600/20">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-green-400 font-semibold">
                            {operator.user?.name || operator.user?.email || "Unknown Operator"}
                          </h3>
                          <p className="text-gray-400 text-sm">{operator.user?.email}</p>
                          <div className="mt-2 space-y-1 text-sm">
                            <p><span className="text-gray-400">City:</span> <span className="text-green-400">{operator.cityName}</span></p>
                            <p><span className="text-gray-400">Area:</span> <span className="text-green-400">{operator.areaName}</span></p>
                            {operator.customBranding && (
                              <p><span className="text-gray-400">Custom Branding:</span> <span className="text-green-400">{operator.customBranding}</span></p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={operator.hasFreeMonths ? "default" : "secondary"}
                            className={operator.hasFreeMonths ? "bg-green-600 text-black" : "bg-gray-600 text-white"}
                          >
                            {operator.hasFreeMonths ? `${operator.freeMonthsCount} Free Months` : "No Free Months"}
                          </Badge>
                          {operator.hasFreeMonths && operator.freeMonthsGrantedAt && (
                            <p className="text-xs text-gray-400 mt-1">
                              Granted: {new Date(operator.freeMonthsGrantedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Free Months Management Tab */}
        <TabsContent value="free-months" className="space-y-6">
          <Card className="bg-black/60 border-green-600/30">
            <CardHeader>
              <CardTitle className="text-green-400 flex items-center">
                <Gift className="w-5 h-5 mr-2" />
                Free Months Management
              </CardTitle>
              <CardDescription className="text-gray-300">
                Grant or revoke free months for operators (Trustee Only)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingOperators ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-gray-400 mt-2">Loading operators...</p>
                </div>
              ) : operators.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No operators found</p>
              ) : (
                <div className="space-y-4">
                  {operators.map((operator) => (
                    <div key={operator.id} className="bg-black/40 rounded-lg p-4 border border-green-600/20">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-green-400 font-semibold">
                            {operator.user?.name || operator.user?.email || "Unknown Operator"}
                          </h3>
                          <p className="text-gray-400 text-sm">{operator.user?.email}</p>
                          <p className="text-gray-400 text-sm">{operator.cityName}, {operator.areaName}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <Badge 
                              variant={operator.hasFreeMonths ? "default" : "secondary"}
                              className={operator.hasFreeMonths ? "bg-green-600 text-black" : "bg-gray-600 text-white"}
                            >
                              {operator.hasFreeMonths ? `${operator.freeMonthsCount} Free Months` : "No Free Months"}
                            </Badge>
                            {operator.hasFreeMonths && operator.freeMonthsGrantedAt && (
                              <p className="text-xs text-gray-400 mt-1">
                                Granted: {new Date(operator.freeMonthsGrantedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {!operator.hasFreeMonths ? (
                              <Button
                                onClick={() => toggleFreeMonthsMutation.mutate({
                                  operatorUserId: operator.operatorUserId,
                                  hasFreeMonths: true,
                                  freeMonthsCount: 1
                                })}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-black font-semibold"
                                disabled={toggleFreeMonthsMutation.isPending}
                                data-testid={`button-grant-free-months-${operator.operatorUserId}`}
                              >
                                Grant 1 Month
                              </Button>
                            ) : (
                              <Button
                                onClick={() => toggleFreeMonthsMutation.mutate({
                                  operatorUserId: operator.operatorUserId,
                                  hasFreeMonths: false
                                })}
                                size="sm"
                                variant="destructive"
                                disabled={toggleFreeMonthsMutation.isPending}
                                data-testid={`button-revoke-free-months-${operator.operatorUserId}`}
                              >
                                Revoke
                              </Button>
                            )}
                          </div>
                        </div>
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

// Organization card component for seat management
function OrganizationCard({ organization, onUpdate }: { organization: any; onUpdate: () => void }) {
  const [newQuantity, setNewQuantity] = useState(organization.seatLimit?.toString() || "1");
  const [subscription, setSubscription] = useState<any>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const { toast } = useToast();

  // Load subscription details
  useEffect(() => {
    const loadSubscription = async () => {
      if (!organization.stripeSubscriptionId) return;
      
      setLoadingSubscription(true);
      try {
        const response = await apiRequest("GET", `/api/admin/organizations/${organization.id}/subscription`);
        const data = await response.json();
        if (data.status === "active") {
          setSubscription(data.subscription);
          setNewQuantity(data.subscription.quantity?.toString() || "1");
        }
      } catch (error) {
        console.error("Failed to load subscription:", error);
      } finally {
        setLoadingSubscription(false);
      }
    };

    loadSubscription();
  }, [organization.id, organization.stripeSubscriptionId]);

  const updateSeats = async () => {
    const quantity = Number(newQuantity);
    if (quantity < 1 || isNaN(quantity)) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a valid number of seats (minimum 1)",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiRequest("POST", `/api/admin/organizations/${organization.id}/seats`, {
        quantity
      });
      const result = await response.json();
      
      toast({
        title: "Seats Updated",
        description: result.message,
      });
      
      onUpdate();
      
      // Reload subscription info
      const subResponse = await apiRequest("GET", `/api/admin/organizations/${organization.id}/subscription`);
      const subData = await subResponse.json();
      if (subData.status === "active") {
        setSubscription(subData.subscription);
      }
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-4 bg-black/40 rounded-lg border border-green-600/20">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-green-400">{organization.name}</h3>
          <p className="text-sm text-gray-400">
            Current limit: {organization.seatLimit} seats
          </p>
          {organization.stripeCustomerId && (
            <p className="text-xs text-gray-500">
              Customer ID: {organization.stripeCustomerId}
            </p>
          )}
        </div>
        <Badge 
          className={
            organization.stripeSubscriptionId 
              ? "bg-green-600 text-black" 
              : "bg-gray-600 text-white"
          }
        >
          {organization.stripeSubscriptionId ? "Active" : "No Subscription"}
        </Badge>
      </div>

      {loadingSubscription ? (
        <p className="text-gray-400 text-sm">Loading subscription details...</p>
      ) : subscription ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Status:</span>
              <span className="ml-2 text-green-400 capitalize">{subscription.status}</span>
            </div>
            <div>
              <span className="text-gray-400">Current Seats:</span>
              <span className="ml-2 text-green-400">{subscription.quantity}</span>
            </div>
            <div>
              <span className="text-gray-400">Monthly Cost:</span>
              <span className="ml-2 text-green-400">
                ${((subscription.amount * subscription.quantity) / 100).toFixed(2)} {subscription.currency?.toUpperCase()}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Billing Cycle:</span>
              <span className="ml-2 text-green-400 capitalize">{subscription.interval}ly</span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-green-600/20">
            <Label htmlFor={`seats-${organization.id}`} className="text-gray-300">
              Update Seats:
            </Label>
            <Input
              id={`seats-${organization.id}`}
              type="number"
              min="1"
              value={newQuantity}
              onChange={(e) => setNewQuantity(e.target.value)}
              className="w-20 bg-black/40 border-green-600/50"
              data-testid={`input-seats-${organization.id}`}
            />
            <Button
              onClick={updateSeats}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-black font-semibold"
              data-testid={`button-update-seats-${organization.id}`}
            >
              Update
            </Button>
          </div>
        </div>
      ) : organization.stripeSubscriptionId ? (
        <p className="text-yellow-400 text-sm">Subscription found but details unavailable</p>
      ) : (
        <p className="text-gray-400 text-sm">No active subscription</p>
      )}
    </div>
  );
}