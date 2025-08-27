import React from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Player, Match, Bounty } from '../../../shared/schema';

interface PlayerWithRank extends Player {
  rank: number;
}

const LadderPage: React.FC = () => {
  const { data: players = [], isLoading: playersLoading } = useQuery<Player[]>({
    queryKey: ['/api/players'],
  });

  const { data: matches = [] } = useQuery<Match[]>({
    queryKey: ['/api/matches'],
  });

  const { data: bounties = [] } = useQuery<Bounty[]>({
    queryKey: ['/api/bounties'],
  });

  const rankedPlayers = React.useMemo(() => {
    return players
      .sort((a, b) => b.points - a.points)
      .map((player, index) => ({ ...player, rank: index + 1 }));
  }, [players]);

  const topPlayers = rankedPlayers.slice(0, 3);
  const activeBounties = bounties.filter(b => b.active);

  if (playersLoading) {
    return (
      <div className="text-center py-20">
        <div className="text-green-400 text-xl">Loading ladder...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12 felt-bg rounded-lg border border-green-700/30">
        <h1 className="text-5xl font-bold text-green-400 neon-glow mb-4">
          THE LADDER
        </h1>
        <p className="text-green-500 text-xl mb-4">
          Where legends are made and wallets are emptied
        </p>
        <p className="text-green-600 text-sm mb-8">
          First rule of the hustle: You don't tell 'em where the bread came from. just eat
        </p>
        
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
            data-testid={`podium-rank-${player.rank}`}
          >
            <div className="text-4xl mb-2">
              {player.rank === 1 ? '👑' : player.rank === 2 ? '🥈' : '🥉'}
            </div>
            <div className="text-2xl font-bold mb-1">{player.name}</div>
            <div className="text-sm text-green-500 mb-2">{player.city}</div>
            <div className="text-3xl font-bold cash-glow">${player.points}</div>
            <div className="text-xs mt-2">
              {player.wins}W - {player.rating} Rating
            </div>
            {player.respectPoints > 0 && (
              <div className="badge-respect mt-2">
                {player.respectPoints} Respect
              </div>
            )}
            {player.specialStatus !== 'none' && (
              <div className={`mt-2 badge-${player.specialStatus}`}>
                {player.specialStatus === 'birthday' && '🎂 Birthday Month'}
                {player.specialStatus === 'family_support' && '❤️ Family Support'}
                {player.specialStatus === 'free_pass' && '🛑 Free Pass'}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Full Ladder Table */}
      <div className="table-dark">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left">Rank</th>
              <th className="text-left">Player</th>
              <th className="text-left">City</th>
              <th className="text-left">Points</th>
              <th className="text-left">W-L</th>
              <th className="text-left">Streak</th>
              <th className="text-left">Status</th>
              <th className="text-left">Respect</th>
            </tr>
          </thead>
          <tbody>
            {rankedPlayers.map((player) => (
              <tr key={player.id} data-testid={`player-row-${player.id}`}>
                <td className="font-mono text-lg font-bold">#{player.rank}</td>
                <td className="font-bold">
                  <div className="flex items-center gap-2">
                    {player.rank <= 3 && (
                      <span>{player.rank === 1 ? '👑' : player.rank === 2 ? '🥈' : '🥉'}</span>
                    )}
                    <span>{player.name}</span>
                    {player.member && <span className="text-green-500 text-xs">★</span>}
                  </div>
                </td>
                <td className="text-green-500">{player.city}</td>
                <td className="font-bold text-xl cash-glow cash-counter">
                  ${player.points.toLocaleString()}
                </td>
                <td>
                  <span className="text-green-400">{player.wins}</span>
                  -
                  <span className="text-red-400">{player.rating - player.wins}</span>
                </td>
                <td>
                  {player.streak > 0 ? (
                    <span className="text-green-400">🔥 {player.streak}</span>
                  ) : (
                    <span className="text-gray-500">-</span>
                  )}
                </td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {player.specialStatus === 'birthday' && (
                      <span className="badge-birthday">🎂 Birthday</span>
                    )}
                    {player.specialStatus === 'family_support' && (
                      <span className="badge-support">❤️ Support</span>
                    )}
                    {player.specialStatus === 'free_pass' && (
                      <span className="badge-support">🛑 Free Pass</span>
                    )}
                    {player.achievements.includes('break_run_master') && (
                      <span className="text-xs bg-purple-800/30 text-purple-300 px-2 py-1 rounded">
                        🎯 Break & Run
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  {player.respectPoints > 0 ? (
                    <span className="badge-respect">⭐ {player.respectPoints}</span>
                  ) : (
                    <span className="text-gray-600">0</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent Matches */}
      <div className="bg-green-900/10 border border-green-700/30 rounded-lg p-6">
        <h3 className="text-2xl font-bold text-green-400 mb-4 flex items-center gap-2">
          <span>⚡</span>
          Recent Action
        </h3>
        <div className="space-y-3">
          {matches.slice(0, 5).map((match) => {
            const winner = players.find(p => p.id === match.winnerId);
            const p1 = players.find(p => p.id === match.p1Id);
            const p2 = players.find(p => p.id === match.p2Id);
            const loser = winner?.id === p1?.id ? p2 : p1;
            
            return (
              <div
                key={match.id}
                className="flex justify-between items-center bg-green-800/10 p-3 rounded border border-green-700/20"
                data-testid={`recent-match-${match.id}`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-green-400 font-bold">{winner?.name}</div>
                  <div className="text-gray-500">defeated</div>
                  <div className="text-red-400">{loser?.name}</div>
                  <div className="text-xs bg-gray-800 px-2 py-1 rounded">{match.game}</div>
                </div>
                <div className="text-yellow-400 font-bold cash-glow">+${match.stake}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center py-8">
        <div className="text-green-400 text-lg mb-4">
          Ready to climb the ladder?
        </div>
        <div className="flex justify-center gap-4">
          <button 
            className="btn-gritty"
            data-testid="button-join-queue"
          >
            🎯 Join the Queue
          </button>
          <button 
            className="btn-gold"
            data-testid="button-challenge-player"
          >
            ⚔️ Challenge a Player
          </button>
        </div>
      </div>
    </div>
  );
};

export default LadderPage;