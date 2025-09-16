import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { GlobalRole } from "@shared/schema";

import { 
  Users, 
  Settings, 
  Crown, 
  Target, 
  Trophy, 
  Zap,
  Shield,
  Star,
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  DollarSign,
  Camera
} from "lucide-react";
import logoBackground from "@assets/assets_task_01k3jk55jwew0tmd764vvanv2x_1756192093_img_0_1756634613619.webp";
import { RevenueCalculator } from "@/components/RevenueCalculator";
import { useAuth } from "@/hooks/useAuth"; // if you have an auth provider

// and add this import (place near other imports)
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

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



export default function Landing() {
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminClickCount, setAdminClickCount] = useState(0);

  const handleLogoClick = () => {
    setAdminClickCount(prev => {
      const newCount = prev + 1;
      if (newCount >= 5) {
        setShowAdminLogin(true);
        return 0;
      }
      return newCount;
    });
  };

   const { user } = useAuth(); // comes from global provider
  // Get user role from authentication - default to PLAYER if not authenticated
  const userRole: GlobalRole = user?.globalRole || "PLAYER";

  const visibleGroups = navigationGroups.filter(
    group => !group.roles || group.roles.includes(userRole)
  );


  const playerFeatures = [
    { icon: Target, title: "Ladder Rankings", desc: "Climb the Big Dog Throne" },
    { icon: Trophy, title: "Tournament Play", desc: "Compete for prizes and glory" },
    { icon: Zap, title: "Special Games", desc: "Money Ball, Kelly Pool & more" },
    { icon: Users, title: "Team Battles", desc: "3v3 and 5v5 team competitions" },
  ];

  const operatorFeatures = [
    { icon: Settings, title: "Hall Management", desc: "Complete pool hall operations" },
    { icon: Users, title: "Player Analytics", desc: "Track performance & engagement" },
    { icon: Crown, title: "Tournament Control", desc: "Create and manage events" },
    { icon: Shield, title: "Financial Security", desc: "Secure payment processing" },
  ];

  return (
    <div className="min-h-screen bg-felt-dark text-white">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div 
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: `url(${logoBackground})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: 'brightness(1.2) contrast(1.1)'
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/25 via-felt-dark/80 to-felt-dark/90"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="p-6">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div 
              className="flex items-center gap-3 cursor-pointer" 
              onClick={() => window.location.href = "/"}
              data-testid="logo-header"
            >
              <img 
                src="/billiards-logo.svg"
                alt="Action Ladder Billiards Logo"
                className="h-16 w-16 rounded-xl object-cover border border-emerald-400/30"
              />
              <div className="flex flex-col leading-5">
                <span className="font-extrabold tracking-wide text-emerald-300 text-2xl">
                  ACTIONLADDER
                </span>
                <span className="text-sm text-emerald-200/70">
                  In here, respect is earned in racks, not words
                </span>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-6">
              {visibleGroups.map(group => (
                <DropdownMenu key={group.id}>
                  <DropdownMenuTrigger className="flex items-center gap-2">
                    <group.icon className="w-4 h-4" />
                    {group.label}
                  </DropdownMenuTrigger>

                  <DropdownMenuContent className="max-h-none bg-gray-900 text-white border border-gray-700">
                    {group.items.map(item => (
                      <DropdownMenuItem
                        className="hover:bg-emerald-700 hover:text-white cursor-pointer"
                        key={item.id}
                        onClick={() => {
                          // Navigate to app and set the specific tab
                          window.location.href = `/app?tab=${item.id}`;
                        }}
                      >
                        {item.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ))}


            </nav>

            {showAdminLogin && (
              <Button
                onClick={() => window.location.href = "/api/login?role=admin"}
                variant="ghost"
                size="sm"
                className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/20"
                data-testid="button-admin-login"
              >
                <Crown className="h-4 w-4 mr-2" />
                Creator Access
              </Button>
            )}
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-black text-white mb-6">
              POOL. POINTS. PRIDE.
            </h1>
            <p className="text-xl text-gray-300 mb-4 max-w-2xl mx-auto">
              The ultimate pool hall management system where players climb the ladder, 
              operators run their halls, and respect is earned one rack at a time.
            </p>
            <Badge className="bg-green-900/40 text-green-300 px-4 py-2 text-sm">
              Skill-Based Competition Platform • APA/BCA Style Leagues
            </Badge>
          </div>
        </section>

        {/* Sign-Up Options */}
        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-emerald-400 mb-4">
              Choose Your Path
            </h2>
            <p className="text-center text-gray-400 mb-12">
              Join as a player to compete, or as an operator to manage your pool hall
            </p>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Player Sign-Up */}
              <Card className="bg-gray-900/50 border-emerald-500/30 hover:border-emerald-400/50 transition-all duration-300 hover:scale-105">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 p-4 bg-emerald-900/30 rounded-full w-fit">
                    <Users className="h-12 w-12 text-emerald-400" />
                  </div>
                  <CardTitle className="text-2xl text-emerald-400">Join as Player</CardTitle>
                  <CardDescription className="text-gray-300">
                    Compete in ladder rankings, tournaments, and special events
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-3">
                    {playerFeatures.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                        <feature.icon className="h-5 w-5 text-emerald-400" />
                        <div>
                          <div className="font-medium text-white">{feature.title}</div>
                          <div className="text-sm text-gray-400">{feature.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button 
                    onClick={() => window.location.href = "/app?tab=player-subscription"}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-lg font-semibold"
                    data-testid="button-signup-player"
                  >
                    Sign Up as Player
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>

                  <div className="text-center">
                    <Badge variant="secondary" className="bg-emerald-900/30 text-emerald-300">
                      Free Registration • Start Competing Today
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Operator Sign-Up */}
              <Card className="bg-gray-900/50 border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 hover:scale-105">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 p-4 bg-blue-900/30 rounded-full w-fit">
                    <Settings className="h-12 w-12 text-blue-400" />
                  </div>
                  <CardTitle className="text-2xl text-blue-400">Join as Operator</CardTitle>
                  <CardDescription className="text-gray-300">
                    Manage your pool hall with professional tournament software
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-3">
                    {operatorFeatures.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                        <feature.icon className="h-5 w-5 text-blue-400" />
                        <div>
                          <div className="font-medium text-white">{feature.title}</div>
                          <div className="text-sm text-gray-400">{feature.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button 
                    onClick={() => window.location.href = "/app?tab=operator-settings"}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold"
                    data-testid="button-signup-operator"
                  >
                    Sign Up as Operator
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>

                  <div className="text-center">
                    <Badge variant="secondary" className="bg-blue-900/30 text-blue-300">
                      Professional Tools • Subscription Based
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Revenue Calculator */}
              <div className="lg:col-span-1">
                <RevenueCalculator />
              </div>
            </div>

            {/* Admin Access (Hidden by default) */}
            {showAdminLogin && (
              <div className="mt-12 flex justify-center">
                <Card className="bg-yellow-900/20 border-yellow-500/30 max-w-md w-full">
                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto mb-4 p-3 bg-yellow-900/30 rounded-full w-fit">
                      <Crown className="h-8 w-8 text-yellow-400" />
                    </div>
                    <CardTitle className="text-xl text-yellow-400">Creator Access</CardTitle>
                    <CardDescription className="text-gray-300">
                      Platform administration and system management
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => window.location.href = "/api/login?role=admin"}
                      className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-semibold"
                      data-testid="button-admin-access"
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      Creator Login
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </section>

        {/* Revenue Projections for Operators */}
        <section className="py-16 px-6 bg-blue-900/20">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-blue-400 mb-8">
              Operator Revenue Projections
            </h2>
            <p className="text-center text-gray-300 mb-12">
              See your potential monthly earnings based on player count and subscription tiers
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Starter Level */}
              <Card className="bg-gray-900/60 border-blue-500/30">
                <CardHeader className="text-center">
                  <CardTitle className="text-xl text-blue-400">Starter Hall</CardTitle>
                  <CardDescription className="text-gray-300">25 Active Players</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white">$2,370</div>
                    <div className="text-sm text-gray-400">Monthly Revenue Potential</div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Subscription Revenue:</span>
                      <span className="text-blue-300">$1,975</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Challenge Fees (30%):</span>
                      <span className="text-blue-300">$395</span>
                    </div>
                  </div>
                  <Badge className="w-full justify-center bg-blue-900/30 text-blue-300">
                    Break-even at 15 players
                  </Badge>
                </CardContent>
              </Card>

              {/* Growth Level */}
              <Card className="bg-gray-900/60 border-emerald-500/30 scale-105">
                <CardHeader className="text-center">
                  <CardTitle className="text-xl text-emerald-400">Growing Hall</CardTitle>
                  <CardDescription className="text-gray-300">50 Active Players</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white">$4,740</div>
                    <div className="text-sm text-gray-400">Monthly Revenue Potential</div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Subscription Revenue:</span>
                      <span className="text-emerald-300">$3,950</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Challenge Fees (30%):</span>
                      <span className="text-emerald-300">$790</span>
                    </div>
                  </div>
                  <Badge className="w-full justify-center bg-emerald-900/30 text-emerald-300">
                    Most Popular Tier
                  </Badge>
                </CardContent>
              </Card>

              {/* Established Level */}
              <Card className="bg-gray-900/60 border-yellow-500/30">
                <CardHeader className="text-center">
                  <CardTitle className="text-xl text-yellow-400">Established Hall</CardTitle>
                  <CardDescription className="text-gray-300">100+ Active Players</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white">$9,480+</div>
                    <div className="text-sm text-gray-400">Monthly Revenue Potential</div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Subscription Revenue:</span>
                      <span className="text-yellow-300">$7,900+</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Challenge Fees (30%):</span>
                      <span className="text-yellow-300">$1,580+</span>
                    </div>
                  </div>
                  <Badge className="w-full justify-center bg-yellow-900/30 text-yellow-300">
                    Premium Earnings
                  </Badge>
                </CardContent>
              </Card>
            </div>

            <div className="mt-12 text-center">
              <p className="text-gray-400 text-sm max-w-2xl mx-auto">
                * Revenue projections based on $79/month pro subscriptions and average challenge fee participation. 
                Actual earnings may vary based on local market conditions and player engagement.
              </p>
            </div>
          </div>
        </section>

        {/* Features Overview */}
        <section className="py-16 px-6 bg-gray-900/30">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-white mb-12">
              Why Action Ladder?
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <Target className="h-16 w-16 text-emerald-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-3">Skill-Based Competition</h3>
                <p className="text-gray-400">
                  Legitimate pool leagues following APA/BCA models. 
                  Performance credits, challenge fees, and prize pools.
                </p>
              </div>

              <div className="text-center">
                <Shield className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-3">Secure Operations</h3>
                <p className="text-gray-400">
                  Professional grade security with Stripe payment processing 
                  and encrypted data management.
                </p>
              </div>

              <div className="text-center">
                <Star className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-3">Community Driven</h3>
                <p className="text-gray-400">
                  Respect points, charity events, and player support programs 
                  that build real pool hall community.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-6 border-t border-gray-800">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-gray-500 text-sm">
              © 2024 Action Ladder Billiards. Professional pool league management platform.
            </p>
            <div className="flex justify-center gap-6 mt-4">
              <a href="/terms" className="text-gray-400 hover:text-emerald-400 text-sm">Terms</a>
              <a href="/privacy" className="text-gray-400 hover:text-emerald-400 text-sm">Privacy</a>
              <a href="/acceptable-use" className="text-gray-400 hover:text-emerald-400 text-sm">Acceptable Use</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}