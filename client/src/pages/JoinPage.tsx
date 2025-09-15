import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import type { PlayerQueue, InsertPlayerQueue } from '../../../shared/schema';

const JoinPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    experience: 'intermediate' as const,
    preferredGames: [] as string[],
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const queryClient = useQueryClient();

  const { data: playerQueue = [] } = useQuery<PlayerQueue[]>({
    queryKey: ['/api/player-queue'],
  });

  const joinQueueMutation = useMutation({
    mutationFn: (data: InsertPlayerQueue) => apiRequest('/api/player-queue', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/player-queue'] });
      setShowSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        city: '',
        experience: 'intermediate',
        preferredGames: [],
      });
      setTimeout(() => setShowSuccess(false), 5000);
    },
  });

  const gameTypes = [
    'Straight 8 (Open)',
    'BCA 8-Ball',
    '9-Ball',
    '10-Ball',
    '1-Pocket',
    'Banks',
    'Straight Pool',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    joinQueueMutation.mutate(formData);
  };

  const handleGameToggle = (game: string) => {
    setFormData(prev => ({
      ...prev,
      preferredGames: prev.preferredGames.includes(game)
        ? prev.preferredGames.filter(g => g !== game)
        : [...prev.preferredGames, game]
    }));
  };

  const pendingCount = playerQueue.filter(p => p.status === 'pending').length;
  const approvedCount = playerQueue.filter(p => p.status === 'approved').length;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-green-400 neon-glow mb-4">
          JOIN THE ACTION
        </h1>
        <p className="text-green-500 text-xl mb-2">
          Ready to climb the ladder? Join our player queue.
        </p>
        <div className="flex justify-center gap-6 text-sm">
          <div className="bg-yellow-800/20 px-3 py-1 rounded border border-yellow-600/50">
            <span className="text-yellow-400">⏳ {pendingCount} pending</span>
          </div>
          <div className="bg-green-800/20 px-3 py-1 rounded border border-green-600/50">
            <span className="text-green-400">✅ {approvedCount} approved</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Join Form */}
        <div className="bg-green-900/10 border border-green-700/30 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-green-400 mb-6 flex items-center gap-2">
            <span>🎯</span>
            Player Registration
          </h2>

          {showSuccess && (
            <div className="bg-green-800/30 border border-green-600/50 rounded p-4 mb-6 text-green-300">
              ✅ Successfully joined the queue! We'll review your application soon.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-green-400 font-bold mb-2">
                Player Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-green-900/20 border border-green-700/50 rounded px-3 py-2 text-green-400 placeholder-green-600"
                placeholder="Your billiards alias..."
                data-testid="input-player-name"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-green-400 font-bold mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-green-900/20 border border-green-700/50 rounded px-3 py-2 text-green-400 placeholder-green-600"
                  placeholder="your@email.com"
                  data-testid="input-email"
                />
              </div>

              <div>
                <label className="block text-green-400 font-bold mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full bg-green-900/20 border border-green-700/50 rounded px-3 py-2 text-green-400 placeholder-green-600"
                  placeholder="(555) 123-4567"
                  data-testid="input-phone"
                />
              </div>
            </div>

            <div>
              <label className="block text-green-400 font-bold mb-2">
                City *
              </label>
              <select
                required
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                className="w-full bg-green-900/20 border border-green-700/50 rounded px-3 py-2 text-green-400"
                data-testid="select-city"
              >
                <option value="">Select your city...</option>
                <option value="San Marcos">San Marcos</option>
                <option value="New Braunfels">New Braunfels</option>
                <option value="Seguin">Seguin</option>
                <option value="Austin">Austin</option>
                <option value="San Antonio">San Antonio</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-green-400 font-bold mb-2">
                Experience Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['beginner', 'intermediate', 'advanced'].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, experience: level as any }))}
                    className={`p-2 rounded text-sm transition-all ${
                      formData.experience === level
                        ? 'bg-green-700/30 border border-green-500 text-green-300'
                        : 'bg-green-900/20 border border-green-700/50 text-green-500 hover:bg-green-800/20'
                    }`}
                    data-testid={`button-experience-${level}`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-green-400 font-bold mb-2">
                Preferred Games
              </label>
              <div className="grid grid-cols-2 gap-2">
                {gameTypes.map((game) => (
                  <button
                    key={game}
                    type="button"
                    onClick={() => handleGameToggle(game)}
                    className={`p-2 rounded text-xs text-left transition-all ${
                      formData.preferredGames.includes(game)
                        ? 'bg-green-700/30 border border-green-500 text-green-300'
                        : 'bg-green-900/20 border border-green-700/50 text-green-500 hover:bg-green-800/20'
                    }`}
                    data-testid={`button-game-${game.replace(/\s+/g, '-').toLowerCase()}`}
                  >
                    {game}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={joinQueueMutation.isPending}
              className="w-full btn-gritty text-lg py-3"
              data-testid="button-submit-application"
            >
              {joinQueueMutation.isPending ? 'Submitting...' : '🎱 Join the Queue'}
            </button>
          </form>
        </div>

        {/* Queue Status & Info */}
        <div className="space-y-6">
          {/* Current Queue */}
          <div className="bg-green-900/10 border border-green-700/30 rounded-lg p-6">
            <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
              <span>📋</span>
              Current Queue
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {playerQueue.slice(0, 10).map((player, index) => (
                <div
                  key={player.id}
                  className="flex justify-between items-center p-3 bg-green-800/10 rounded border border-green-700/20"
                  data-testid={`queue-player-${index}`}
                >
                  <div>
                    <div className="font-bold text-green-400">{player.name}</div>
                    <div className="text-xs text-green-500">
                      {player.city} • {player.experience}
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs ${
                    player.status === 'pending' 
                      ? 'bg-yellow-800/20 text-yellow-400 border border-yellow-600/50'
                      : player.status === 'approved'
                      ? 'bg-green-800/20 text-green-400 border border-green-600/50'
                      : 'bg-red-800/20 text-red-400 border border-red-600/50'
                  }`}>
                    {player.status}
                  </div>
                </div>
              ))}
              {playerQueue.length === 0 && (
                <div className="text-center text-green-500 py-8">
                  No players in queue yet. Be the first!
                </div>
              )}
            </div>
          </div>

          {/* QR Code Placeholder */}
          <div className="bg-green-900/10 border border-green-700/30 rounded-lg p-6 text-center">
            <h3 className="text-xl font-bold text-green-400 mb-4">
              Quick Join via QR
            </h3>
            <div className="w-32 h-32 bg-white mx-auto rounded-lg flex items-center justify-center mb-4">
              <div className="text-4xl">📱</div>
            </div>
            <p className="text-green-500 text-sm">
              Scan to join queue from your phone
            </p>
          </div>

          {/* Process Info */}
          <div className="bg-green-900/10 border border-green-700/30 rounded-lg p-6">
            <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
              <span>ℹ️</span>
              How It Works
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <span className="text-green-400 font-bold">1.</span>
                <span>Submit your application with your info and game preferences</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-400 font-bold">2.</span>
                <span>We review applications and approve qualified players</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-400 font-bold">3.</span>
                <span>Approved players get matched for games and ladder entry</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-400 font-bold">4.</span>
                <span>Start climbing the ladder and earning money!</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinPage;