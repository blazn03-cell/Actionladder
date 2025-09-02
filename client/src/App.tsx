import { useState } from "react";
import { Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Dashboard from "@/components/dashboard";
import Ladder from "@/components/ladder";
import Tournaments from "@/components/tournaments";
import KellyPool from "@/components/kelly-pool";
import Players from "@/components/players";
import Bounties from "@/components/bounties";
import Charity from "@/components/charity";
import LiveStream from "@/components/live-stream";
import HallBattles from "@/components/hall-battles";
import RookieSection from "@/pages/RookieSection";
import BarboxLadderPage from "@/pages/BarboxLadderPage";
import EscrowChallenges from "@/components/escrow-challenges";
import QRRegistration from "@/components/qr-registration";
import LeagueStandings from "@/components/league-standings";
import RealTimeNotifications from "@/components/real-time-notifications";
import PosterGenerator from "@/components/poster-generator";
import AIDashboard from "@/pages/AIDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import OperatorSettings from "@/pages/OperatorSettings";
import TournamentBrackets from "@/pages/TournamentBrackets";
import MoneyOnTable from "@/components/money-on-table";
import SideBetting from "@/pages/SideBetting";
import SideBetOperator from "@/pages/SideBetOperator";
import Checkout from "@/pages/checkout";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import Refund from "@/pages/Refund";
import AcceptableUse from "@/pages/AcceptableUse";
import NotFound from "@/pages/not-found";
import logoBackground from "@assets/assets_task_01k3jk55jwew0tmd764vvanv2x_1756192093_img_0_1756634613619.webp";

const queryClient = new QueryClient();

function Navigation({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) {
  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "ladder", label: "Ladder" },
    { id: "barbox-ladder", label: "King of Barbox" },
    { id: "rookie-section", label: "Rookie Section" },
    { id: "escrow-challenges", label: "Escrow Challenges" },
    { id: "hall-battles", label: "Hall Battles" },
    { id: "league-standings", label: "League Standings" },
    { id: "qr-registration", label: "QR Registration" },
    { id: "poster-generator", label: "Poster Generator" },
    { id: "live-stream", label: "Live Stream" },
    { id: "ai-features", label: "AI Features" },
    { id: "operator-settings", label: "Operator Settings" },
    { id: "admin", label: "Admin" },
    { id: "tournaments", label: "Tournaments" },
    { id: "tournament-brackets", label: "Tournament Brackets" },
    { id: "money-on-table", label: "Money on Table" },
    { id: "side-betting", label: "Match Pools" },
    { id: "side-bet-operator", label: "Pool Ops" },
    { id: "kelly-pool", label: "Kelly Pool" },
    { id: "players", label: "Players" },
    { id: "bounties", label: "Bounties" },
    { id: "charity", label: "Charity" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0d1f12]/90 backdrop-blur border-b border-white/10">
      {/* Row 1: Brand (left) + Live + Join via QR (right) */}
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img 
            src="/attached_assets/assets_task_01k3jk55jwew0tmd764vvanv2x_1756192093_img_0_1756632787662.webp"
            alt="Action Ladder Billiards Logo"
            className="h-12 w-12 rounded-xl object-cover border border-emerald-400/30"
          />
          <div className="flex flex-col leading-5">
            <span className="font-extrabold tracking-wide text-emerald-300 text-lg">
              ACTIONLADDER
            </span>
            <span className="text-xs text-emerald-200/70">
              In here, respect is earned in racks, not words
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full px-3 py-1 text-xs font-bold bg-red-900/40 text-red-300 ring-1 ring-red-500/40">
            ● LIVE NOW
          </span>
          <button
            onClick={() => setActiveTab("qr-registration")}
            className="whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold
                       ring-1 ring-emerald-400/50 bg-emerald-500/15 text-emerald-200
                       hover:bg-emerald-500/25 transition"
          >
            Join via QR
          </button>
        </div>
      </div>

      {/* Row 2: Nav links that WRAP to 2 lines if needed */}
      <nav className="mx-auto max-w-7xl px-4 pb-3">
        <ul
          className="flex flex-wrap gap-x-6 gap-y-2 whitespace-nowrap
                     text-[15px] text-emerald-100/90"
        >
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <li key={tab.id}>
                <button
                  data-testid={`tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-block px-1 py-1 rounded-md hover:text-white transition-colors ${
                    active ? "text-white font-semibold underline decoration-emerald-400/70" : ""
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  {tab.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
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
        
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="relative z-10">
          <Switch>
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
            <Route>
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
                {activeTab === "ladder" && <Ladder />}
                {activeTab === "barbox-ladder" && <BarboxLadderPage />}
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
                {activeTab === "money-on-table" && <MoneyOnTable />}
                {activeTab === "side-betting" && <SideBetting />}
                {activeTab === "side-bet-operator" && <SideBetOperator />}
                {activeTab === "kelly-pool" && <KellyPool />}
                {activeTab === "players" && <Players />}
                {activeTab === "bounties" && <Bounties />}
                {activeTab === "charity" && <Charity />}
              </div>
              <RealTimeNotifications />
            </Route>
            <Route component={NotFound} />
          </Switch>
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
  );
}

export default App;
