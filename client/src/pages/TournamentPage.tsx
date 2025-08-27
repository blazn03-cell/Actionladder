import React, { useState, useEffect } from 'react';
import { TournamentEntryButton } from '../components/SubscribeButton';

interface Tournament {
  id: string;
  name: string;
  hall_id: string;
  max_slots: number;
  is_open: number;
  current_entries: number;
}

interface WaitlistEntry {
  id: number;
  tournament_id: string;
  user_id: string;
  status: string;
  created_at: number;
}

const TournamentPage: React.FC = () => {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  
  // Mock current user - replace with actual auth
  const currentUser = {
    id: 'user_123',
    email: 'player@example.com'
  };

  const tournamentId = 'WEEKLY_8BALL_2025';

  useEffect(() => {
    fetchTournamentData();
  }, []);

  const fetchTournamentData = async () => {
    try {
      // Simulate tournament data fetch
      setTournament({
        id: tournamentId,
        name: 'Weekly 8-Ball Tournament',
        hall_id: 'SEGUIN_WINNERS',
        max_slots: 16,
        is_open: 1,
        current_entries: 14
      });
      
      // Simulate waitlist data
      setWaitlist([
        {
          id: 1,
          tournament_id: tournamentId,
          user_id: 'user_456',
          status: 'waiting',
          created_at: Date.now() / 1000 - 3600
        },
        {
          id: 2,
          tournament_id: tournamentId,
          user_id: 'user_789',
          status: 'waiting',
          created_at: Date.now() / 1000 - 1800
        }
      ]);
    } catch (error) {
      console.error('Failed to fetch tournament data:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinWaitlist = async () => {
    try {
      setWaitlistLoading(true);
      const response = await fetch('/api/tournaments/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          tournamentId: tournamentId
        })
      });

      const data = await response.json();
      if (data.ok) {
        await fetchTournamentData(); // Refresh data
        alert('You have been added to the waitlist! You will be notified if a spot opens up.');
      } else {
        alert(data.error || 'Failed to join waitlist');
      }
    } catch (error) {
      console.error('Waitlist join error:', error);
      alert('Something went wrong joining the waitlist');
    } finally {
      setWaitlistLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-green-400 p-8">
        <div className="max-w-4xl mx-auto text-center py-12">
          <div className="text-2xl">Loading tournament...</div>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-black text-green-400 p-8">
        <div className="max-w-4xl mx-auto text-center py-12">
          <div className="text-2xl text-red-400">Tournament not found</div>
        </div>
      </div>
    );
  }

  const spotsRemaining = tournament.max_slots - tournament.current_entries;
  const isFull = spotsRemaining <= 0;
  const userOnWaitlist = waitlist.some(w => w.user_id === currentUser.id);

  return (
    <div className="min-h-screen bg-black text-green-400 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center py-12 bg-green-900/10 rounded-lg border border-green-700/30 mb-8">
          <h1 className="text-5xl font-bold text-green-400 neon-glow mb-4">
            ACTION LADDER
          </h1>
          <p className="text-xl text-green-500 mb-2">
            Tournament Entry System
          </p>
          <p className="text-green-600 text-sm">
            First rule of the hustle: You don't tell 'em where the bread came from. just eat
          </p>
        </div>

        {/* Tournament Info */}
        <div className="bg-green-900/20 border border-green-600/50 rounded-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-yellow-400 mb-4">{tournament.name}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-semibold text-green-400 mb-4">Tournament Details</h3>
              <div className="space-y-2 text-green-500">
                <p><span className="font-semibold">Hall:</span> {tournament.hall_id}</p>
                <p><span className="font-semibold">Format:</span> Single Elimination 8-Ball</p>
                <p><span className="font-semibold">Entry Fee:</span> $25 (Basic Members) / $30 (Non-Members)</p>
                <p><span className="font-semibold">Prize Pool:</span> Winner takes 70%, Runner-up 30%</p>
                <p><span className="font-semibold">Date:</span> Friday 7:00 PM</p>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-green-400 mb-4">Capacity Status</h3>
              <div className="space-y-4">
                <div className="bg-green-900/30 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-green-400">Players Registered:</span>
                    <span className="text-yellow-400 font-bold">{tournament.current_entries}/{tournament.max_slots}</span>
                  </div>
                  <div className="w-full bg-green-900 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-green-600 to-yellow-500 h-3 rounded-full transition-all"
                      style={{ width: `${(tournament.current_entries / tournament.max_slots) * 100}%` }}
                    ></div>
                  </div>
                  {!isFull && (
                    <p className="text-green-500 text-sm mt-2">
                      {spotsRemaining} spots remaining
                    </p>
                  )}
                  {isFull && (
                    <p className="text-red-400 text-sm mt-2 font-semibold">
                      Tournament is full
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Entry Actions */}
        <div className="bg-green-900/10 border border-green-700/30 rounded-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-green-400 mb-6">Tournament Entry</h3>
          
          {!isFull && (
            <div className="text-center">
              <TournamentEntryButton
                userId={currentUser.id}
                tournamentId={tournament.id}
                userEmail={currentUser.email}
                className="text-lg px-8 py-4"
                label="Enter Tournament"
              />
              <p className="text-green-600 text-sm mt-4">
                Secure payment processing via Stripe
              </p>
            </div>
          )}

          {isFull && !userOnWaitlist && (
            <div className="text-center">
              <button
                onClick={joinWaitlist}
                disabled={waitlistLoading}
                className="inline-flex items-center justify-center rounded-xl px-8 py-4 text-lg font-semibold shadow-sm transition hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed bg-yellow-600 text-black hover:bg-yellow-700"
                data-testid="button-join-waitlist"
              >
                {waitlistLoading ? "Adding to waitlist..." : "Join Waitlist"}
              </button>
              <p className="text-green-600 text-sm mt-4">
                Tournament is full. Join the waitlist to be notified if a spot opens up.
              </p>
            </div>
          )}

          {isFull && userOnWaitlist && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center rounded-xl px-8 py-4 text-lg font-semibold bg-green-600/20 border border-green-600 text-green-400">
                You're on the waitlist
              </div>
              <p className="text-green-600 text-sm mt-4">
                You will be notified if a spot becomes available.
              </p>
            </div>
          )}
        </div>

        {/* Waitlist Display */}
        {waitlist.length > 0 && (
          <div className="bg-green-900/10 border border-green-700/30 rounded-lg p-8">
            <h3 className="text-2xl font-bold text-green-400 mb-6">Tournament Waitlist</h3>
            <div className="space-y-3">
              {waitlist.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    entry.user_id === currentUser.id 
                      ? 'bg-yellow-500/10 border border-yellow-500/30' 
                      : 'bg-green-900/20 border border-green-700/30'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl font-bold text-yellow-400">#{index + 1}</div>
                    <div>
                      <p className="text-green-400 font-semibold">
                        {entry.user_id === currentUser.id ? 'You' : `Player ${entry.user_id.slice(-3)}`}
                      </p>
                      <p className="text-green-600 text-sm">
                        Joined {new Date(entry.created_at * 1000).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      entry.status === 'waiting' ? 'bg-yellow-500/20 text-yellow-400' :
                      entry.status === 'offered' ? 'bg-green-500/20 text-green-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {entry.status.toUpperCase()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-green-900/20 rounded-lg">
              <h4 className="text-lg font-semibold text-green-400 mb-2">How the Waitlist Works:</h4>
              <ul className="text-green-600 text-sm space-y-1">
                <li>• When a player cancels or doesn't show, the next person on the waitlist is notified</li>
                <li>• You have 12 hours to claim your spot when offered</li>
                <li>• Large/Mega tier subscribers get free tournament entry when promoted</li>
                <li>• Others pay the standard entry fee when accepting their waitlist offer</li>
              </ul>
            </div>
          </div>
        )}

        {/* Legal Notice */}
        <div className="bg-green-900/10 border border-green-700/30 rounded-lg p-6 text-center mt-8">
          <h3 className="text-lg font-bold text-green-400 mb-2">Action Ladder - Skill-Based Competition</h3>
          <p className="text-sm text-green-600 mb-2">
            Entry fees for skill-based tournaments. All prizes distributed from collected entry fees.
          </p>
          <p className="text-xs text-green-700">
            Challenge fees range from $60-$500,000 for high-stakes players seeking serious competition.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TournamentPage;