import React, { useState } from 'react';
import { Router, Route, Link, useLocation } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Pages
import LadderPage from './pages/LadderPage';
import StreamPage from './pages/StreamPage';
import JoinPage from './pages/JoinPage';
import AdminPage from './pages/AdminPage';
import PaymentsPage from './pages/PaymentsPage';
import SpecialEventsPage from './pages/SpecialEventsPage';
import PosterGeneratorPage from './pages/PosterGeneratorPage';

// Components
import Header from './components/Header';
import Footer from './components/Footer';

// Utils
import { queryClient } from './lib/queryClient';

// Logo - Use fallback for now
const logoPath = '/billiards-logo.svg';

function Navigation() {
  const [location] = useLocation();
  
  const navItems = [
    { href: '/', label: 'Ladder', icon: '🎱' },
    { href: '/stream', label: 'Live Stream', icon: '📺' },
    { href: '/join', label: 'Join Queue', icon: '🎯' },
    { href: '/events', label: 'Special Events', icon: '🎉' },
    { href: '/payments', label: 'Payments', icon: '💰' },
    { href: '/poster', label: 'Fight Night Poster', icon: '🥊' },
    { href: '/admin', label: 'Admin', icon: '⚙️' },
  ];

  return (
    <nav className="bg-green-900/20 border-b border-green-700/30 sticky top-0 z-50 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-4">
            <img 
              src={logoPath} 
              alt="Action Ladder Billiards" 
              className="w-10 h-10 rounded-full"
              data-testid="logo-image"
            />
            <div className="hidden md:block">
              <h1 className="text-xl font-bold text-green-400 neon-glow" data-testid="site-title">
                Action Ladder Billiards
              </h1>
              <p className="text-xs text-green-500" data-testid="site-tagline">
                First rule of the hustle: You don't tell 'em where the bread came from. just eat
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 overflow-x-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded text-sm transition-all duration-200 whitespace-nowrap ${
                  location === item.href
                    ? 'bg-green-700/30 text-green-300 border border-green-500/50'
                    : 'text-green-400 hover:bg-green-800/20 hover:text-green-300'
                }`}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <span className="mr-1">{item.icon}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-black text-green-400 gritty-texture">

        
        <Router>
          <Navigation />
          
          <main className="container mx-auto px-4 py-8">
            <Route path="/" component={LadderPage} />
            <Route path="/stream" component={StreamPage} />
            <Route path="/join" component={JoinPage} />
            <Route path="/events" component={SpecialEventsPage} />
            <Route path="/payments" component={PaymentsPage} />
            <Route path="/poster" component={PosterGeneratorPage} />
            <Route path="/admin" component={AdminPage} />
          </main>
          
          <Footer />
        </Router>
      </div>
    </QueryClientProvider>
  );
}

export default App;