import React from 'react';

const AdminPage: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-green-400 neon-glow mb-4">
          ADMIN PANEL
        </h1>
        <p className="text-green-500 text-xl">
          Control the action from behind the scenes
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Player Management */}
        <div className="bg-green-900/10 border border-green-700/30 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-green-400 mb-4">
            Player Management
          </h2>
          <div className="space-y-4">
            <button className="w-full btn-gritty">View All Players</button>
            <button className="w-full btn-gritty">Approve Queue</button>
            <button className="w-full btn-gritty">Manage Special Events</button>
          </div>
        </div>

        {/* Financial Controls */}
        <div className="bg-green-900/10 border border-green-700/30 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-green-400 mb-4">
            Financial Controls
          </h2>
          <div className="space-y-4">
            <button className="w-full btn-gold">Process Payments</button>
            <button className="w-full btn-gold">Set Betting Limits</button>
            <button className="w-full btn-gold">Generate Reports</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;