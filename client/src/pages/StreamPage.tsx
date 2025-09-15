import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { StreamStatus } from '../../../shared/schema';

const StreamPage: React.FC = () => {
  const [embedUrl, setEmbedUrl] = useState('');
  
  const { data: streamStatus } = useQuery<StreamStatus>({
    queryKey: ['/api/stream-status'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleStreamUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (embedUrl.includes('twitch.tv')) {
      // Convert Twitch URL to embed
      const channelName = embedUrl.split('/').pop();
      setEmbedUrl(`https://player.twitch.tv/?channel=${channelName}&parent=localhost`);
    } else if (embedUrl.includes('youtube.com') || embedUrl.includes('youtu.be')) {
      // Convert YouTube URL to embed
      const videoId = embedUrl.includes('youtube.com') 
        ? embedUrl.split('v=')[1]?.split('&')[0]
        : embedUrl.split('/').pop();
      setEmbedUrl(`https://www.youtube.com/embed/${videoId}?autoplay=1`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Stream Status Header */}
      <div className="text-center">
        <div className="flex justify-center items-center gap-4 mb-4">
          <h1 className="text-4xl font-bold text-green-400 neon-glow">LIVE STREAM</h1>
          {streamStatus?.isLive ? (
            <div className="flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full live-pulse">
              <div className="w-3 h-3 bg-white rounded-full"></div>
              <span className="text-white font-bold">LIVE NOW</span>
            </div>
          ) : (
            <div className="bg-gray-600 px-3 py-1 rounded-full">
              <span className="text-white">OFFLINE</span>
            </div>
          )}
        </div>
        
        {streamStatus?.isLive && streamStatus.viewers > 0 && (
          <div className="text-green-400">
            👁️ {streamStatus.viewers.toLocaleString()} viewers watching
          </div>
        )}
      </div>

      {/* Stream Embed */}
      <div className="aspect-video bg-black rounded-lg border border-green-700/30 overflow-hidden">
        {streamStatus?.embedUrl || embedUrl ? (
          <iframe
            src={streamStatus?.embedUrl || embedUrl}
            className="w-full h-full"
            frameBorder="0"
            allowFullScreen
            allow="autoplay; encrypted-media"
            data-testid="stream-embed"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="text-6xl mb-4">📺</div>
            <h3 className="text-2xl font-bold text-green-400 mb-2">No Stream Active</h3>
            <p className="text-green-500 mb-6">
              When matches are being streamed, they'll appear here
            </p>
            
            {/* Quick Stream Setup */}
            <form onSubmit={handleStreamUrlSubmit} className="max-w-md w-full">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={embedUrl}
                  onChange={(e) => setEmbedUrl(e.target.value)}
                  placeholder="Paste Twitch/YouTube URL..."
                  className="flex-1 bg-green-900/20 border border-green-700/50 rounded px-3 py-2 text-green-400 placeholder-green-600"
                  data-testid="input-stream-url"
                />
                <button
                  type="submit"
                  className="btn-gritty"
                  data-testid="button-set-stream"
                >
                  Set Stream
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Stream Info Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Platform Info */}
        <div className="bg-green-900/10 border border-green-700/30 rounded-lg p-6">
          <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
            <span>📡</span>
            Streaming Platforms
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-purple-400 text-xl">🎮</span>
                <span>Twitch</span>
              </div>
              <button className="text-xs bg-purple-800/20 text-purple-300 px-2 py-1 rounded">
                Connect
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-red-400 text-xl">📹</span>
                <span>YouTube Live</span>
              </div>
              <button className="text-xs bg-red-800/20 text-red-300 px-2 py-1 rounded">
                Connect
              </button>
            </div>
          </div>
        </div>

        {/* Stream Schedule */}
        <div className="bg-green-900/10 border border-green-700/30 rounded-lg p-6">
          <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
            <span>📅</span>
            Streaming Schedule
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Fight Nights</span>
              <span className="text-green-400">Fridays 7PM</span>
            </div>
            <div className="flex justify-between">
              <span>Tournament Finals</span>
              <span className="text-green-400">Weekends</span>
            </div>
            <div className="flex justify-between">
              <span>Challenge Matches</span>
              <span className="text-green-400">As Scheduled</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Integration Placeholder */}
      <div className="bg-green-900/10 border border-green-700/30 rounded-lg p-6">
        <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
          <span>💬</span>
          Stream Chat
        </h3>
        <div className="bg-black/50 rounded p-4 min-h-[200px] border border-green-700/20">
          <div className="text-green-500 text-sm text-center py-8">
            Chat will appear here when stream is live
          </div>
        </div>
      </div>

      {/* Stream Features */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-green-900/10 border border-green-700/30 rounded">
          <div className="text-2xl mb-2">🎯</div>
          <div className="font-bold text-green-400">Live Scoring</div>
          <div className="text-xs text-green-500">Real-time point updates</div>
        </div>
        <div className="text-center p-4 bg-green-900/10 border border-green-700/30 rounded">
          <div className="text-2xl mb-2">💰</div>
          <div className="font-bold text-green-400">Stakes Display</div>
          <div className="text-xs text-green-500">See the money on the line</div>
        </div>
        <div className="text-center p-4 bg-green-900/10 border border-green-700/30 rounded">
          <div className="text-2xl mb-2">🏆</div>
          <div className="font-bold text-green-400">Match Stats</div>
          <div className="text-xs text-green-500">Player records & rankings</div>
        </div>
      </div>
    </div>
  );
};

export default StreamPage;