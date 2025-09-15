import { useState } from "react";
import { Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { ChevronDown, Trophy, Camera, DollarSign, Users, Settings } from "lucide-react";
import type { GlobalRole } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import Dashboard from "@/components/dashboard";
import Ladder from "@/components/ladder";
import Tournaments from "@/components/tournaments";
import Players from "@/components/players";
import Bounties from "@/components/bounties";
import Charity from "@/components/charity";
import LiveStream from "@/components/live-stream";
import HallBattles from "@/components/hall-battles";
import RookieSection from "@/pages/RookieSection";
import BarboxLadderPage from "@/pages/BarboxLadderPage";
import EightFootLadderPage from "@/pages/EightFootLadderPage";
import EscrowChallenges from "@/components/escrow-challenges";
import QRRegistration from "@/components/qr-registration";
import LeagueStandings from "@/components/league-standings";
import RealTimeNotifications from "@/components/real-time-notifications";
import PosterGenerator from "@/components/poster-generator";
import AIDashboard from "@/pages/AIDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import OperatorSettings from "@/pages/OperatorSettings";
import TournamentBrackets from "@/pages/TournamentBrackets";
import SpecialGames from "@/pages/SpecialGames";
import Checkout from "@/pages/checkout";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import Refund from "@/pages/Refund";
import AcceptableUse from "@/pages/AcceptableUse";
import TeamManagement from "@/pages/TeamManagement";
import TeamMatches from "@/pages/TeamMatches";
import TeamChallenges from "@/components/team-challenges";
import SportsmanshipSystem from "@/components/sportsmanship-system";
import MatchDivisions from "@/components/match-divisions";
import OperatorSubscriptions from "@/pages/OperatorSubscriptions";
import MonetizationDashboard from "@/pages/MonetizationDashboard";
import { FileManager } from "@/components/file-upload";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import AuthSuccess from "@/pages/AuthSuccess";
import { PlayerSubscription } from "@/pages/PlayerSubscription";
import { ChallengeCalendar } from "@/pages/ChallengeCalendar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { MobileNav } from "@/components/MobileNav";
import logoBackground from "@assets/assets_task_01k3jk55jwew0tmd764vvanv2x_1756192093_img_0_1756634613619.webp";

const queryClient = new QueryClient();

function Navigation({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  
  // Business-focused navigation structure (5 sections)
  const navigationGroups = [
    {
      id: "competition",
      label: "Competition",
      icon: Trophy,
      items: [
        { id: "dashboard", label: "📊 Dashboard" },
        // Ladders Section
        { id: "ladder", label: "🥇 Big Dog Throne (9ft)" },
        { id: "eightfoot-ladder", label: "🥈 Almost Big Time (8ft)" },
        { id: "barbox-ladder", label: "🥉 Kiddie Box King (7ft)" },
        { id: "rookie-section", label: "🔰 Rookie Section" },
        // Challenges Section  
        { id: "escrow-challenges", label: "⚔️ Challenge Matches" },
        { id: "challenge-calendar", label: "📅 Challenge Calendar" },
        { id: "hall-battles", label: "🏟️ Hall Battles" },
        // Tournaments Section
        { id: "tournaments", label: "🏆 Tournaments" },
        { id: "tournament-brackets", label: "🌲 Tournament Brackets" },
        { id: "special-games", label: "⭐ Special Games" },
        // Standings Section
        { id: "league-standings", label: "📈 League Standings" },
        { id: "match-divisions", label: "📊 Match Divisions" },
      ]
    },
    {
      id: "media",
      label: "Media",
      icon: Camera,
      items: [
        { id: "live-stream", label: "📺 Live Stream" },
        { id: "ai-features", label: "🤖 AI Features" },
        { id: "poster-generator", label: "🎨 Poster Generator" },
        { id: "file-manager", label: "📁 File Manager" },
      ]
    },
    {
      id: "finance",
      label: "Finance",
      icon: DollarSign,
      items: [
        { id: "player-subscription", label: "💳 Subscription Plans" },
        { id: "checkout", label: "💰 Billing & Payments" },
        { id: "monetization", label: "📊 Revenue Dashboard", roles: ["OWNER", "OPERATOR", "TRUSTEE"] as GlobalRole[] },
      ]
    },
    {
      id: "community",
      label: "Community",
      icon: Users,
      items: [
        { id: "team-management", label: "👥 Team Management" },
        { id: "team-matches", label: "🤝 Team Matches" },
        { id: "team-challenges", label: "⚡ Team Challenges" },
        { id: "players", label: "🎯 Players" },
        { id: "sportsmanship", label: "🤝 Sportsmanship" },
        { id: "bounties", label: "💎 Bounties" },
        { id: "charity", label: "❤️ Charity" },
      ]
    },
    {
      id: "operations",
      label: "Operations",
      icon: Settings,
      roles: ["OWNER", "OPERATOR", "TRUSTEE"] as GlobalRole[], // Role-based section visibility
      items: [
        { id: "qr-registration", label: "📱 QR Registration" },
        { id: "operator-settings", label: "⚙️ Operator Settings" },
        { id: "operator-subscriptions", label: "💼 Operator Subscriptions" },
        { id: "admin", label: "🛡️ Admin Dashboard" },
      ]
    },
  ];

  // Get user role from authentication - default to PLAYER if not authenticated
  const userRole: GlobalRole = user?.globalRole || "PLAYER";
  
  // Filter groups based on user role (OWNER sees all, others see role-specific)
  const visibleGroups = navigationGroups.filter(group => 
    !group.roles || userRole === "OWNER" || group.roles.includes(userRole)
  );
  
  // Show loading state while fetching user data
  if (isLoading) {
    return (
      <header className="sticky top-0 z-50 bg-[#0d1f12]/90 backdrop-blur border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-center">
          <div className="text-emerald-300">Loading...</div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 bg-[#0d1f12]/90 backdrop-blur border-b border-white/10">
      {/* Row 1: Brand (left) + Live + Join via QR (right) */}
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-2 md:gap-4">
        <div className="flex items-center gap-2 md:gap-3">
          <img 
            src="/attached_assets/assets_task_01k3jk55jwew0tmd764vvanv2x_1756192093_img_0_1756632787662.webp"
            alt="Action Ladder Billiards Logo"
            className="h-10 w-10 md:h-12 md:w-12 rounded-xl object-cover border border-emerald-400/30"
          />
          <div className="flex flex-col leading-tight">
            <span className="font-extrabold tracking-wide text-emerald-300 text-sm md:text-lg">
              ACTIONLADDER
            </span>
            <span className="hidden sm:block text-xs text-emerald-200/70">
              In here, respect is earned in racks, not words
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <span className="hidden sm:inline rounded-full px-3 py-1 text-xs font-bold bg-red-900/40 text-red-300 ring-1 ring-red-500/40">
            ● LIVE NOW
          </span>
          <button
            onClick={() => setActiveTab("qr-registration")}
            className="hidden sm:inline-flex btn-mobile whitespace-nowrap rounded-xl px-3 md:px-4 py-2 text-xs md:text-sm font-semibold
                       ring-1 ring-emerald-400/50 bg-emerald-500/15 text-emerald-200
                       hover:bg-emerald-500/25 transition items-center"
            data-testid="button-join-qr"
          >
            Join via QR
          </button>
          <MobileNav 
            navigationGroups={navigationGroups}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            userRole={userRole}
          />
        </div>
      </div>

    </header>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-felt-dark text-white font-sans overflow-x-hidden">
        {/* Professional Logo Background */}
        <div className="fixed inset-0 pointer-events-none">
          <div 
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `url(${logoBackground})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-felt-dark/80 to-felt-dark/90"></div>
        </div>
        
        <ErrorBoundary>
          <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
        </ErrorBoundary>
        
        <main className="relative z-10">
          <ErrorBoundary>
            <Switch>
            <Route path="/">
              <Landing />
            </Route>
            <Route path="/auth-success">
              <AuthSuccess />
            </Route>
            <Route path="/checkout">
              <Checkout />
            </Route>
            <Route path="/terms">
              <Terms />
            </Route>
            <Route path="/privacy">
              <Privacy />
            </Route>
            <Route path="/refund">
              <Refund />
            </Route>
            <Route path="/acceptable-use">
              <AcceptableUse />
            </Route>
            <Route path="/app">
              {/* Hero Banner */}
              <section className="py-12 relative overflow-hidden">
                <div 
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: `url(${logoBackground})`,
                    backgroundSize: 'contain',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                  }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 via-transparent to-emerald-600/20"></div>
                <div className="container mx-auto px-4 relative z-10">
                  <div className="text-center">
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                      POOL. POINTS. PRIDE.
                    </h2>
                    <p className="text-lg text-gray-300 mb-6">
                      In here, respect is earned in racks, not words
                    </p>
                  </div>
                </div>
              </section>

              <div className="container mx-auto px-4 py-8">
                {activeTab === "dashboard" && <Dashboard />}
                {activeTab === "player-subscription" && <PlayerSubscription />}
                {activeTab === "ladder" && <Ladder />}
                {activeTab === "barbox-ladder" && <BarboxLadderPage />}
                {activeTab === "eightfoot-ladder" && <EightFootLadderPage />}
                {activeTab === "rookie-section" && <RookieSection />}
                {activeTab === "escrow-challenges" && <EscrowChallenges />}
                {activeTab === "hall-battles" && <HallBattles />}
                {activeTab === "league-standings" && <LeagueStandings />}
                {activeTab === "qr-registration" && <QRRegistration />}
                {activeTab === "poster-generator" && <PosterGenerator />}
                {activeTab === "live-stream" && <LiveStream />}
                {activeTab === "ai-features" && <AIDashboard />}
                {activeTab === "operator-settings" && <OperatorSettings />}
                {activeTab === "admin" && <AdminDashboard />}
                {activeTab === "tournaments" && <Tournaments />}
                {activeTab === "tournament-brackets" && <TournamentBrackets />}
                {activeTab === "special-games" && <SpecialGames />}
                {activeTab === "players" && <Players />}
                {activeTab === "bounties" && <Bounties />}
                {activeTab === "charity" && <Charity />}
                {activeTab === "team-management" && <TeamManagement />}
                {activeTab === "team-matches" && <TeamMatches />}
                {activeTab === "team-challenges" && <TeamChallenges />}
                {activeTab === "match-divisions" && <MatchDivisions />}
                {activeTab === "sportsmanship" && <SportsmanshipSystem />}
                {activeTab === "file-manager" && <FileManager />}
                {activeTab === "operator-subscriptions" && <OperatorSubscriptions />}
                {activeTab === "monetization" && <MonetizationDashboard />}
                {activeTab === "challenge-calendar" && <ChallengeCalendar />}
              </div>
              <RealTimeNotifications />
            </Route>
            <Route component={NotFound} />
            </Switch>
          </ErrorBoundary>
        </main>
        
        <Toaster />
        
        {/* Footer with Policy Links */}
        <footer className="relative z-10 bg-black/80 border-t border-neon-green/20 py-8 mt-16">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center items-center space-x-6 text-sm text-gray-400">
              <a href="/terms" className="hover:text-neon-green transition-colors">Terms of Service</a>
              <a href="/privacy" className="hover:text-neon-green transition-colors">Privacy Policy</a>
              <a href="/refund" className="hover:text-neon-green transition-colors">Refund Policy</a>
              <a href="/acceptable-use" className="hover:text-neon-green transition-colors">Acceptable Use</a>
              <span className="text-neon-green">•</span>
              <span>© 2025 ActionLadder</span>
              <span className="text-neon-green">•</span>
              <span className="font-mono">v1.0.0</span>
            </div>
          </div>
        </footer>
        </div>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
