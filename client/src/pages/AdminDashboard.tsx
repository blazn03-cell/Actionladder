import React, { useState, useEffect } from 'react';

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
  offer_url?: string;
  offer_expires_at?: number;
  created_at: number;
}

interface Member {
  id: string;
  email: string;
  display_name: string;
  role: string;
  membership_status: string;
  current_period_end?: number;
  stripe_customer_id?: string;
}

const AdminDashboard: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      fetchWaitlist(selectedTournament);
    }
  }, [selectedTournament]);

  const fetchDashboardData = async () => {
    try {
      // Simulate fetching tournaments and members
      setTournaments([
        {
          id: 'WEEKLY_8BALL_2025',
          name: 'Weekly 8-Ball Tournament',
          hall_id: 'SEGUIN_WINNERS',
          max_slots: 16,
          is_open: 0,
          current_entries: 16
        },
        {
          id: 'MONTHLY_9BALL_2025',
          name: 'Monthly 9-Ball Championship',
          hall_id: 'SEGUIN_WINNERS',
          max_slots: 32,
          is_open: 1,
          current_entries: 28
        }
      ]);

      setMembers([
        {
          id: 'user_123',
          email: 'player1@example.com',
          display_name: 'Mike "The Shark" Johnson',
          role: 'large',
          membership_status: 'active',
          stripe_customer_id: 'cus_test123'
        },
        {
          id: 'user_456',
          email: 'player2@example.com',
          display_name: 'Sarah "Steady" Williams',
          role: 'small',
          membership_status: 'active',
          stripe_customer_id: 'cus_test456'
        }
      ]);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWaitlist = async (tournamentId: string) => {
    try {
      // Simulate waitlist fetch
      setWaitlist([
        {
          id: 1,
          tournament_id: tournamentId,
          user_id: 'user_789',
          status: 'waiting',
          created_at: Date.now() / 1000 - 3600
        },
        {
          id: 2,
          tournament_id: tournamentId,
          user_id: 'user_101',
          status: 'offered',
          offer_url: 'https://checkout.stripe.com/...',
          offer_expires_at: Date.now() / 1000 + 43200, // 12 hours from now
          created_at: Date.now() / 1000 - 1800
        }
      ]);
    } catch (error) {
      console.error('Failed to fetch waitlist:', error);
    }
  };

  const promoteNextPlayer = async (tournamentId: string) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/admin/tournaments/${tournamentId}/offer-next`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'admin_key_placeholder'
        }
      });

      const data = await response.json();
      
      if (data.ok) {
        if (data.promoted === 'offered') {
          setMessage(`Offered spot to ${data.userId}. Checkout link: ${data.url}`);
        } else if (data.promoted === 'comped') {
          setMessage(`Promoted ${data.userId} with comped entry (Large/Mega subscriber)`);
        }
        await fetchWaitlist(tournamentId);
      } else {
        setMessage(`No promotion: ${data.reason || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Promotion error:', error);
      setMessage('Failed to promote player from waitlist');
    } finally {
      setActionLoading(false);
    }
  };

  const exportMembersCSV = () => {
    const csv = [
      ['ID', 'Email', 'Name', 'Role', 'Status', 'Stripe Customer ID'].join(','),
      ...members.map(m => [
        m.id,
        m.email,
        m.display_name,
        m.role,
        m.membership_status,
        m.stripe_customer_id || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `members_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-green-400 p-8">
        <div className="max-w-6xl mx-auto text-center py-12">
          <div className="text-2xl">Loading admin dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-400 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center py-12 bg-green-900/10 rounded-lg border border-green-700/30 mb-8">
          <h1 className="text-5xl font-bold text-green-400 neon-glow mb-4">
            ACTION LADDER
          </h1>
          <p className="text-xl text-green-500 mb-2">
            Admin Dashboard - Tournament & Waitlist Management
          </p>
          <p className="text-green-600 text-sm">
            First rule of the hustle: You don't tell 'em where the bread came from. just eat
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-green-900/20 border border-green-600/50 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-2">{tournaments.length}</div>
            <div className="text-green-400">Active Tournaments</div>
          </div>
          <div className="bg-green-900/20 border border-green-600/50 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-2">{members.length}</div>
            <div className="text-green-400">Total Members</div>
          </div>
          <div className="bg-green-900/20 border border-green-600/50 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-2">
              {waitlist.filter(w => w.status === 'waiting').length}
            </div>
            <div className="text-green-400">Waitlist Queue</div>
          </div>
          <div className="bg-green-900/20 border border-green-600/50 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-2">
              {members.filter(m => m.role !== 'nonmember').length}
            </div>
            <div className="text-green-400">Paid Subscribers</div>
          </div>
        </div>

        {/* Tournament Management */}
        <div className="bg-green-900/10 border border-green-700/30 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-green-400 mb-6">Tournament Management</h2>
          
          <div className="mb-6">
            <label className="block text-green-400 text-sm font-semibold mb-2">
              Select Tournament:
            </label>
            <select
              value={selectedTournament}
              onChange={(e) => setSelectedTournament(e.target.value)}
              className="bg-green-900/20 border border-green-700/50 rounded px-3 py-2 text-green-400 w-full max-w-md"
              data-testid="select-tournament"
            >
              <option value="">Choose a tournament...</option>
              {tournaments.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.current_entries}/{t.max_slots})
                </option>
              ))}
            </select>
          </div>

          {selectedTournament && (
            <div className="space-y-6">
              <div className="bg-green-900/20 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-green-400 mb-4">Tournament Details</h3>
                {tournaments.map(t => t.id === selectedTournament && (
                  <div key={t.id} className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-green-500"><span className="font-semibold">Name:</span> {t.name}</p>
                      <p className="text-green-500"><span className="font-semibold">Hall:</span> {t.hall_id}</p>
                      <p className="text-green-500"><span className="font-semibold">Capacity:</span> {t.current_entries}/{t.max_slots}</p>
                    </div>
                    <div>
                      <p className="text-green-500">
                        <span className="font-semibold">Status:</span> 
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${
                          t.is_open ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
                        }`}>
                          {t.is_open ? 'OPEN' : 'FULL'}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Waitlist Management */}
              <div className="bg-green-900/20 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-green-400">Waitlist Management</h3>
                  <button
                    onClick={() => promoteNextPlayer(selectedTournament)}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-yellow-600 text-black font-semibold rounded-xl hover:bg-yellow-700 disabled:opacity-60"
                    data-testid="button-promote-next"
                  >
                    {actionLoading ? 'Processing...' : 'Promote Next Player'}
                  </button>
                </div>

                {message && (
                  <div className="mb-4 p-3 bg-green-600/10 border border-green-600/30 rounded text-green-400 text-sm">
                    {message}
                  </div>
                )}

                <div className="space-y-3">
                  {waitlist.length === 0 ? (
                    <p className="text-green-600 text-center py-4">No players on waitlist</p>
                  ) : (
                    waitlist.map((entry, index) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-4 bg-green-900/30 rounded-lg border border-green-700/30"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="text-2xl font-bold text-yellow-400">#{index + 1}</div>
                          <div>
                            <p className="text-green-400 font-semibold">Player {entry.user_id.slice(-3)}</p>
                            <p className="text-green-600 text-sm">
                              Joined {new Date(entry.created_at * 1000).toLocaleString()}
                            </p>
                            {entry.offer_expires_at && (
                              <p className="text-yellow-400 text-sm">
                                Offer expires: {new Date(entry.offer_expires_at * 1000).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            entry.status === 'waiting' ? 'bg-yellow-500/20 text-yellow-400' :
                            entry.status === 'offered' ? 'bg-green-500/20 text-green-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {entry.status.toUpperCase()}
                          </div>
                          {entry.offer_url && (
                            <div className="text-xs">
                              <a 
                                href={entry.offer_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300"
                              >
                                Checkout Link
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Member Management */}
        <div className="bg-green-900/10 border border-green-700/30 rounded-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-green-400">Member Management</h2>
            <button
              onClick={exportMembersCSV}
              className="px-4 py-2 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700"
              data-testid="button-export-csv"
            >
              Export CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-green-700/30">
                  <th className="text-left p-3 text-green-400">Name</th>
                  <th className="text-left p-3 text-green-400">Email</th>
                  <th className="text-left p-3 text-green-400">Tier</th>
                  <th className="text-left p-3 text-green-400">Status</th>
                  <th className="text-left p-3 text-green-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map(member => (
                  <tr key={member.id} className="border-b border-green-700/20">
                    <td className="p-3 text-green-500">{member.display_name}</td>
                    <td className="p-3 text-green-600">{member.email}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        member.role === 'mega' ? 'bg-purple-600/20 text-purple-400' :
                        member.role === 'large' ? 'bg-blue-600/20 text-blue-400' :
                        member.role === 'medium' ? 'bg-green-600/20 text-green-400' :
                        member.role === 'small' ? 'bg-yellow-600/20 text-yellow-400' :
                        'bg-gray-600/20 text-gray-400'
                      }`}>
                        {member.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        member.membership_status === 'active' ? 'bg-green-600/20 text-green-400' :
                        member.membership_status === 'past_due' ? 'bg-red-600/20 text-red-400' :
                        'bg-gray-600/20 text-gray-400'
                      }`}>
                        {member.membership_status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3">
                      {member.stripe_customer_id && (
                        <button className="text-blue-400 hover:text-blue-300 text-xs">
                          View Billing
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;