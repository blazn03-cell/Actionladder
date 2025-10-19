import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MembershipDisplay } from '@/components/membership-display';
import { WeightRulesDisplay } from '@/components/weight-rules-display';
import { TutoringSystem } from '@/components/tutoring-system';

interface Player {
  id: string;
  name: string;
  city: string;
  points: number;
  rating: number;
  wins: number;
  rank: number;
  streak: number;
  respectPoints: number;
  member: boolean;
  specialStatus?: "birthday" | "family_support" | "free_pass";
  achievements: string[];
  eightFootRating?: number;
  eightFootWins?: number;
  eightFootLosses?: number;
  eightFootPoints?: number;
  eightFootPassActive?: boolean;
}

interface Bounty {
  id: string;
  type: "onRank" | "onPlayer";
  rank?: number;
  playerId?: string;
  prize: number;
}

export default function EightFootLadderPage() {
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  // Query players data
  const { data: players = [], isLoading: playersLoading } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  // Query bounties data  
  const { data: bounties = [] } = useQuery<Bounty[]>({
    queryKey: ["/api/bounties"],
  });

  // Filter active bounties
  const activeBounties = bounties.filter((b: Bounty) => b.prize > 0);

  // Simulate 8ft ladder rankings (in real implementation, this would be separate)
  const rankedPlayers = players
    .map((player, index) => ({
      ...player,
      eightFootRating: player.eightFootRating || player.rating,
      eightFootPoints: player.eightFootPoints || Math.floor(player.points * 0.8), // Simulate 8ft points
      eightFootWins: player.eightFootWins || Math.floor(player.wins * 0.7),
      eightFootLosses: player.eightFootLosses || Math.floor((player.rating - player.wins) * 0.7),
      rank: index + 1
    }))
    .sort((a, b) => (b.eightFootPoints || 0) - (a.eightFootPoints || 0))
    .map((player, index) => ({ ...player, rank: index + 1 }));

  // Top 3 players for podium
  const topPlayers = rankedPlayers.slice(0, 3);

  // 8ft specific divisions
  const eightFootContenders = rankedPlayers.filter(p => (p.eightFootRating || 0) <= 650); // Tier 1  
  const eightFootElite = rankedPlayers.filter(p => (p.eightFootRating || 0) >= 651); // Tier 2

  if (playersLoading) {
    return (
      <div className="text-center py-20">
        <div className="text-green-400 text-xl">Loading 8ft ladder...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12 felt-bg rounded-lg border border-green-700/30">
        <h1 className="text-5xl font-bold text-green-400 neon-glow mb-4">
          ALMOST BIG TIME
        </h1>
        <p className="text-green-500 text-xl mb-2">
          📏 8ft Tables Only
        </p>
        <p className="text-amber-400 text-lg mb-4 font-semibold">
          🌟 Premium Section - $50/month Add-On
        </p>
        <p className="text-green-600 text-sm mb-8">
          Lock into the bonus pool before the break
        </p>
        
        {/* Premium Access Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowPremiumModal(true)}
            className="bg-amber-600 hover:bg-amber-700 text-black font-bold py-3 px-6 rounded-lg text-lg"
            data-testid="button-premium-access"
          >
            Unlock 8ft Ladder Access - $50/month
          </button>
        </div>
        
        {/* Live Bounties */}
        {activeBounties.length > 0 && (
          <div className="bg-red-900/20 border border-red-600/50 rounded-lg p-4 max-w-2xl mx-auto">
            <h3 className="text-red-400 font-bold mb-2 flex items-center justify-center gap-2">
              <span className="live-pulse w-3 h-3 bg-red-500 rounded-full"></span>
              ACTIVE BOUNTIES
            </h3>
            <div className="space-y-2">
              {activeBounties.map((bounty) => (
                <div key={bounty.id} className="text-red-300 text-sm">
                  ${bounty.prize} bounty on {bounty.type === 'onRank' ? `Rank #${bounty.rank}` : 'targeted player'}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Membership & Weight Rules */}
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-8">
        <MembershipDisplay 
          membershipTier="pro" 
          onUpgrade={() => console.log('Upgrade membership')}
        />
        <WeightRulesDisplay 
          weightOwed={true}
          consecutiveLosses={2}
          weightMultiplier={1.2}
        />
      </div>

      {/* Tutoring System for Pro Members */}
      <div className="max-w-2xl mx-auto mb-8">
        <TutoringSystem 
          isPro={true}
          fargoRating={650}
          monthlySessions={1}
          availableCredits={15}
          onScheduleSession={() => console.log('Schedule tutoring session')}
        />
      </div>

      {/* Top 3 Podium */}
      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {topPlayers.map((player) => (
          <div
            key={player.id}
            className={`text-center p-6 rounded-lg border ${
              player.rank === 1
                ? 'bg-yellow-900/20 border-yellow-600/50 rank-1'
                : player.rank === 2
                ? 'bg-gray-900/20 border-gray-600/50 rank-2'
                : 'bg-amber-900/20 border-amber-600/50 rank-3'
            }`}
            data-testid={`eightfoot-podium-rank-${player.rank}`}
          >
            <div className="text-4xl mb-2">
              {player.rank === 1 ? '👑' : player.rank === 2 ? '🥈' : '🥉'}
            </div>
            <div className="text-2xl font-bold mb-1">{player.name}</div>
            <div className="text-sm text-green-500 mb-2">{player.city}</div>
            <div className="text-3xl font-bold cash-glow">${player.eightFootPoints}</div>
            <div className="text-xs mt-2">
              {player.eightFootWins}W-{player.eightFootLosses}L • {player.eightFootRating} Rating
            </div>
            {player.respectPoints > 0 && (
              <div className="badge-respect mt-2">
                {player.respectPoints} Respect
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 8ft Contenders Division */}
      <div className="felt-bg rounded-lg border border-green-700/30 p-6">
        <h2 className="text-3xl font-bold text-green-400 mb-6 text-center">
          🎯 8ft Contenders (Rating ≤ 650)
        </h2>
        
        <div className="table-dark">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left">Rank</th>
                <th className="text-left">Player</th>
                <th className="text-left">City</th>
                <th className="text-left">8ft Points</th>
                <th className="text-left">8ft W-L</th>
                <th className="text-left">Rating</th>
                <th className="text-left">Respect</th>
              </tr>
            </thead>
            <tbody>
              {eightFootContenders.slice(0, 10).map((player) => (
                <tr key={player.id} data-testid={`eightfoot-contender-${player.id}`}>
                  <td className="font-mono text-lg font-bold">#{player.rank}</td>
                  <td className="font-bold">
                    <div className="flex items-center gap-2">
                      {player.rank <= 3 && (
                        <span>{player.rank === 1 ? '👑' : player.rank === 2 ? '🥈' : '🥉'}</span>
                      )}
                      <span>{player.name}</span>
                      {player.member && <span className="text-green-500 text-xs">★</span>}
                      {player.eightFootPassActive && (
                        <span className="text-xs bg-amber-600/20 text-amber-400 px-2 py-1 rounded">8FT</span>
                      )}
                    </div>
                  </td>
                  <td className="text-green-500">{player.city}</td>
                  <td className="font-bold text-xl cash-glow cash-counter">
                    ${(player.eightFootPoints || 0).toLocaleString()}
                  </td>
                  <td>
                    <span className="text-green-400">{player.eightFootWins}</span>
                    -
                    <span className="text-red-400">{player.eightFootLosses}</span>
                  </td>
                  <td className="text-blue-400">{player.eightFootRating}</td>
                  <td>
                    {player.respectPoints > 0 && (
                      <span className="badge-respect">{player.respectPoints}</span>
                    )}
                  </td>
                </tr>
              ))}
              {eightFootContenders.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-green-600">
                    No 8ft contenders yet. Be the first to join!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 8ft Elite Division */}
      <div className="felt-bg rounded-lg border border-green-700/30 p-6">
        <h2 className="text-3xl font-bold text-green-400 mb-6 text-center">
          👑 8ft Elite (Rating ≥ 651)
        </h2>
        
        <div className="table-dark">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left">Rank</th>
                <th className="text-left">Player</th>
                <th className="text-left">City</th>
                <th className="text-left">8ft Points</th>
                <th className="text-left">8ft W-L</th>
                <th className="text-left">Rating</th>
                <th className="text-left">Respect</th>
              </tr>
            </thead>
            <tbody>
              {eightFootElite.slice(0, 10).map((player) => (
                <tr key={player.id} data-testid={`eightfoot-elite-${player.id}`}>
                  <td className="font-mono text-lg font-bold">#{player.rank}</td>
                  <td className="font-bold">
                    <div className="flex items-center gap-2">
                      {player.rank <= 3 && (
                        <span>{player.rank === 1 ? '👑' : player.rank === 2 ? '🥈' : '🥉'}</span>
                      )}
                      <span>{player.name}</span>
                      {player.member && <span className="text-green-500 text-xs">★</span>}
                      {player.eightFootPassActive && (
                        <span className="text-xs bg-amber-600/20 text-amber-400 px-2 py-1 rounded">8FT</span>
                      )}
                    </div>
                  </td>
                  <td className="text-green-500">{player.city}</td>
                  <td className="font-bold text-xl cash-glow cash-counter">
                    ${(player.eightFootPoints || 0).toLocaleString()}
                  </td>
                  <td>
                    <span className="text-green-400">{player.eightFootWins}</span>
                    -
                    <span className="text-red-400">{player.eightFootLosses}</span>
                  </td>
                  <td className="text-blue-400">{player.eightFootRating}</td>
                  <td>
                    {player.respectPoints > 0 && (
                      <span className="badge-respect">{player.respectPoints}</span>
                    )}
                  </td>
                </tr>
              ))}
              {eightFootElite.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-green-600">
                    No 8ft elite players yet. Be the first to join!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Games in Rotation */}
      <div className="felt-bg rounded-lg border border-green-700/30 p-6">
        <h2 className="text-3xl font-bold text-green-400 mb-6 text-center">
          🎮 Main 8-Foot Table Games
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-black/30 rounded border border-green-800/30 p-4">
            <h3 className="text-green-400 font-bold mb-2">Straight 8 (Open)</h3>
            <p className="text-green-600 text-sm">Open table 8-ball format</p>
          </div>
          
          <div className="bg-black/30 rounded border border-green-800/30 p-4">
            <h3 className="text-green-400 font-bold mb-2">BCA 8-Ball</h3>
            <p className="text-green-600 text-sm">Official tournament rules</p>
          </div>
          
          <div className="bg-black/30 rounded border border-green-800/30 p-4">
            <h3 className="text-green-400 font-bold mb-2">Fast 8</h3>
            <p className="text-green-600 text-sm">Speed variation of 8-ball</p>
          </div>
          
          <div className="bg-black/30 rounded border border-green-800/30 p-4">
            <h3 className="text-green-400 font-bold mb-2">14.1 (Straight Pool)</h3>
            <p className="text-green-600 text-sm">Continuous rack format</p>
          </div>
          
          <div className="bg-black/30 rounded border border-green-800/30 p-4">
            <h3 className="text-green-400 font-bold mb-2">Saratoga</h3>
            <p className="text-green-600 text-sm">Regional specialty game</p>
          </div>
          
          <div className="bg-black/30 rounded border border-green-800/30 p-4">
            <h3 className="text-green-400 font-bold mb-2">9-Ball</h3>
            <p className="text-green-600 text-sm">Rotation game, low to high</p>
          </div>
          
          <div className="bg-black/30 rounded border border-green-800/30 p-4">
            <h3 className="text-green-400 font-bold mb-2">10-Ball</h3>
            <p className="text-green-600 text-sm">Call shot rotation</p>
          </div>
          
          <div className="bg-black/30 rounded border border-green-800/30 p-4">
            <h3 className="text-green-400 font-bold mb-2">1-Pocket</h3>
            <p className="text-green-600 text-sm">Strategic pocket game</p>
          </div>
          
          <div className="bg-black/30 rounded border border-green-800/30 p-4">
            <h3 className="text-green-400 font-bold mb-2">Banks</h3>
            <p className="text-green-600 text-sm">All shots must bank</p>
          </div>
          
          <div className="bg-black/30 rounded border border-green-800/30 p-4">
            <h3 className="text-green-400 font-bold mb-2">9-Ball Banks</h3>
            <p className="text-green-600 text-sm">Banking rotation game</p>
          </div>
          
          <div className="bg-black/30 rounded border border-green-800/30 p-4">
            <h3 className="text-green-400 font-bold mb-2">1 Ball 1 Pocket</h3>
            <p className="text-green-600 text-sm">Single ball pocket game</p>
          </div>
        </div>
      </div>

      {/* Premium Features */}
      <div className="felt-bg rounded-lg border border-amber-700/30 p-6">
        <h2 className="text-3xl font-bold text-amber-400 mb-6 text-center">
          🌟 Premium 8ft Ladder Features
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-black/30 rounded border border-amber-800/30 p-4">
            <h3 className="text-amber-400 font-bold mb-2">📊 Dedicated 8ft Rankings</h3>
            <p className="text-green-600 text-sm">Separate ratings and standings for 8ft play only</p>
          </div>
          
          <div className="bg-black/30 rounded border border-amber-800/30 p-4">
            <h3 className="text-amber-400 font-bold mb-2">🏆 8ft Championships</h3>
            <p className="text-green-600 text-sm">Exclusive tournaments for 8ft table specialists</p>
          </div>
          
          <div className="bg-black/30 rounded border border-amber-800/30 p-4">
            <h3 className="text-amber-400 font-bold mb-2">💰 Enhanced Payouts</h3>
            <p className="text-green-600 text-sm">Higher prize pools for 8ft ladder matches</p>
          </div>
          
          <div className="bg-black/30 rounded border border-amber-800/30 p-4">
            <h3 className="text-amber-400 font-bold mb-2">📈 Advanced Stats</h3>
            <p className="text-green-600 text-sm">Detailed analytics for 8ft table performance</p>
          </div>
        </div>
        
        <div className="text-center mt-6">
          <button
            onClick={() => setShowPremiumModal(true)}
            className="bg-amber-600 hover:bg-amber-700 text-black font-bold py-2 px-4 rounded"
            data-testid="button-premium-upgrade"
          >
            Upgrade to 8ft Premium - $50/month
          </button>
        </div>
      </div>

      {/* Premium Access Modal */}
      {showPremiumModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-black border border-amber-600/50 rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-2xl font-bold text-amber-400 mb-4">8ft Ladder Premium</h3>
            <p className="text-green-600 mb-4">
              Join the exclusive 8ft ladder with dedicated rankings, championships, and enhanced features.
            </p>
            <div className="text-amber-400 text-3xl font-bold mb-4">$50/month</div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPremiumModal(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded"
                data-testid="button-cancel-premium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // TODO: Integrate with Stripe for premium subscription
                  setShowPremiumModal(false);
                }}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-black font-bold py-2 px-4 rounded"
                data-testid="button-confirm-premium"
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}