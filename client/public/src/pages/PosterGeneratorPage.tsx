import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Player } from '../../../shared/schema';

const PosterGeneratorPage: React.FC = () => {
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [eventTitle, setEventTitle] = useState('FIGHT NIGHT');
  const [eventDate, setEventDate] = useState('');
  const [stakes, setStakes] = useState('$1000');
  
  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ['/api/players'],
  });

  // Get top 2 players automatically
  const topPlayers = players
    .sort((a, b) => b.points - a.points)
    .slice(0, 2);

  const handleGeneratePoster = () => {
    const playersToUse = selectedPlayers.length >= 2 ? selectedPlayers.slice(0, 2) : topPlayers;
    
    // In a real implementation, this would generate an actual poster image
    console.log('Generating poster for:', {
      players: playersToUse,
      title: eventTitle,
      date: eventDate,
      stakes: stakes
    });
    
    // For now, show a preview
    alert(`Poster generated! ${playersToUse[0]?.name} vs ${playersToUse[1]?.name} - ${eventTitle}`);
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-green-400 neon-glow mb-4">
          FIGHT NIGHT POSTER GENERATOR
        </h1>
        <p className="text-green-500 text-xl">
          One-click poster creation for epic matchups
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Poster Controls */}
        <div className="bg-green-900/10 border border-green-700/30 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-green-400 mb-6">
            Poster Settings
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-green-400 font-bold mb-2">
                Event Title
              </label>
              <input
                type="text"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                className="w-full bg-green-900/20 border border-green-700/50 rounded px-3 py-2 text-green-400"
                placeholder="FIGHT NIGHT"
                data-testid="input-event-title"
              />
            </div>

            <div>
              <label className="block text-green-400 font-bold mb-2">
                Event Date
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full bg-green-900/20 border border-green-700/50 rounded px-3 py-2 text-green-400"
                data-testid="input-event-date"
              />
            </div>

            <div>
              <label className="block text-green-400 font-bold mb-2">
                Stakes
              </label>
              <input
                type="text"
                value={stakes}
                onChange={(e) => setStakes(e.target.value)}
                className="w-full bg-green-900/20 border border-green-700/50 rounded px-3 py-2 text-green-400"
                placeholder="$1000"
                data-testid="input-stakes"
              />
            </div>

            <div>
              <label className="block text-green-400 font-bold mb-2">
                Fighter Selection
              </label>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedPlayers(topPlayers)}
                  className="w-full btn-gritty text-left"
                  data-testid="button-use-top-2"
                >
                  🏆 Use Top 2 Players ({topPlayers[0]?.name} vs {topPlayers[1]?.name})
                </button>
                <div className="text-xs text-green-500">
                  Or manually select players below
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Poster Preview */}
        <div className="bg-black border border-green-700/30 rounded-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-green-400 mb-6">
            Poster Preview
          </h2>

          <div className="bg-gradient-to-br from-red-900/30 to-black border-2 border-yellow-400 rounded-lg p-8 aspect-[3/4] flex flex-col justify-between">
            {/* Event Title */}
            <div>
              <div className="text-3xl font-bold text-yellow-400 cash-glow mb-2">
                {eventTitle}
              </div>
              {eventDate && (
                <div className="text-green-400 mb-4">
                  {new Date(eventDate).toLocaleDateString()}
                </div>
              )}
            </div>

            {/* Fighters */}
            <div className="flex-1 flex flex-col justify-center">
              {(selectedPlayers.length >= 2 ? selectedPlayers.slice(0, 2) : topPlayers).map((player, index) => (
                <div key={player?.id} className="mb-4">
                  <div className={`text-2xl font-bold ${index === 0 ? 'text-red-400' : 'text-blue-400'}`}>
                    {player?.name || 'TBD'}
                  </div>
                  <div className="text-green-400 text-sm">
                    {player?.city} • ${player?.points?.toLocaleString()}
                  </div>
                  {index === 0 && (
                    <div className="text-yellow-400 text-xl font-bold my-4">
                      VS
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Stakes */}
            <div className="border-t border-yellow-400/30 pt-4">
              <div className="text-yellow-400 font-bold text-lg cash-glow">
                STAKES: {stakes}
              </div>
              <div className="text-xs text-green-500 mt-2">
                First rule of the hustle: You don't tell 'em where the bread came from. just eat
              </div>
            </div>
          </div>

          <button
            onClick={handleGeneratePoster}
            className="btn-gold mt-6 w-full text-lg py-3"
            data-testid="button-generate-poster"
          >
            🎨 Generate Poster
          </button>
        </div>
      </div>

      {/* Player Selection */}
      <div className="bg-green-900/10 border border-green-700/30 rounded-lg p-6">
        <h3 className="text-xl font-bold text-green-400 mb-4">
          Manual Player Selection
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {players.slice(0, 12).map((player) => (
            <button
              key={player.id}
              onClick={() => {
                if (selectedPlayers.find(p => p.id === player.id)) {
                  setSelectedPlayers(prev => prev.filter(p => p.id !== player.id));
                } else if (selectedPlayers.length < 2) {
                  setSelectedPlayers(prev => [...prev, player]);
                }
              }}
              className={`p-3 rounded text-left transition-all ${
                selectedPlayers.find(p => p.id === player.id)
                  ? 'bg-green-700/30 border border-green-500 text-green-300'
                  : 'bg-green-900/20 border border-green-700/50 text-green-500 hover:bg-green-800/20'
              } ${selectedPlayers.length >= 2 && !selectedPlayers.find(p => p.id === player.id) ? 'opacity-50' : ''}`}
              disabled={selectedPlayers.length >= 2 && !selectedPlayers.find(p => p.id === player.id)}
              data-testid={`button-select-player-${player.id}`}
            >
              <div className="font-bold">{player.name}</div>
              <div className="text-xs opacity-75">{player.city} • ${player.points.toLocaleString()}</div>
            </button>
          ))}
        </div>
        <div className="text-xs text-green-600 mt-4">
          Select up to 2 players for custom matchups. Currently selected: {selectedPlayers.length}/2
        </div>
      </div>

      {/* Poster Templates */}
      <div className="bg-green-900/10 border border-green-700/30 rounded-lg p-6">
        <h3 className="text-xl font-bold text-green-400 mb-4">
          Poster Templates
        </h3>
        <div className="grid md:grid-cols-4 gap-4">
          {['Classic Boxing', 'Dark & Gritty', 'Neon Billiards', 'High Stakes'].map((template) => (
            <div
              key={template}
              className="bg-green-800/10 border border-green-700/30 rounded p-4 text-center cursor-pointer hover:border-green-500/50 transition-all"
              data-testid={`template-${template.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className="text-2xl mb-2">🎨</div>
              <div className="text-sm text-green-400">{template}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PosterGeneratorPage;