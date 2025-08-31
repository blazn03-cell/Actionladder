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
import EscrowChallenges from "@/components/escrow-challenges";
import QRRegistration from "@/components/qr-registration";
import LeagueStandings from "@/components/league-standings";
import RealTimeNotifications from "@/components/real-time-notifications";
import PosterGenerator from "@/components/poster-generator";
import AIDashboard from "@/pages/AIDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import OperatorSettings from "@/pages/OperatorSettings";
import TournamentBrackets from "@/pages/TournamentBrackets";
import Checkout from "@/pages/checkout";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import Refund from "@/pages/Refund";
import AcceptableUse from "@/pages/AcceptableUse";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Navigation({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) {
  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "ladder", label: "Ladder" },
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
    { id: "kelly-pool", label: "Kelly Pool" },
    { id: "players", label: "Players" },
    { id: "bounties", label: "Bounties" },
    { id: "charity", label: "Charity" },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-felt-dark/80 border-b border-neon-green/20">
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between py-4">
          {/* Brand Logo */}
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-neon-green to-accent rounded-xl flex items-center justify-center shadow-neon">
              <span className="text-xl font-black text-felt-dark">🎱</span>
            </div>
            <div>
              <h1 className="text-xl font-black text-neon-green">ACTIONLADDER</h1>
              <p className="text-sm text-gray-400">In here, respect is earned in racks, not words</p>
            </div>
          </div>
          
          {/* Live Status Badge */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-red-600/20 border border-red-500/50 rounded-full px-3 py-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-red-400">LIVE NOW</span>
            </div>
            <button className="bg-neon-green/20 hover:bg-neon-green/30 border border-neon-green/50 text-neon-green px-4 py-2 rounded-lg transition-colors">
              Join via QR
            </button>
          </div>
          
          {/* Mobile Menu Button */}
          <button className="md:hidden p-2">
            <svg className="w-6 h-6 text-neon-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
        </nav>
        
        {/* Navigation Tabs - Scrollable Strip */}
        <div className="overflow-x-auto no-scrollbar">
          <ul className="inline-flex gap-4 px-4 py-2 whitespace-nowrap">
            {tabs.map((tab) => (
              <li key={tab.id}>
                <button
                  data-testid={`tab-${tab.id}`}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? "bg-neon-green/20 text-neon-green border border-neon-green/50"
                      : "hover:bg-white/10 text-gray-300"
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </header>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-felt-dark text-white font-sans overflow-x-hidden">
        {/* Background Effects */}
        <div className="fixed inset-0 bg-felt-texture opacity-90 pointer-events-none"></div>
        <div className="fixed inset-0 bg-smoky opacity-40 pointer-events-none"></div>
        
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
              <section className="bg-gradient-to-r from-felt-green/50 to-transparent py-8">
                <div className="container mx-auto px-4">
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
            </div>
          </div>
        </footer>
      </div>
    </QueryClientProvider>
  );
}

export default App;
