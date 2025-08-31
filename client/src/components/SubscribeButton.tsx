import React, { useState } from 'react';

export interface SubscribeButtonProps {
  hallId: string;
  operatorId: string;
  playerCount: number;
  email?: string;
  className?: string;
  label?: string;
}

export const SubscribeButton: React.FC<SubscribeButtonProps> = ({ 
  hallId, 
  operatorId, 
  playerCount, 
  email,
  className = "",
  label = "Subscribe Now"
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hallId, operatorId, playerCount, email }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // Stripe Checkout
      } else {
        setError(data.error || "Checkout failed");
      }
    } catch (err: any) {
      console.error("Subscribe error", err);
      setError("Something went wrong starting checkout.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        onClick={handleSubscribe}
        disabled={loading}
        className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold shadow-sm transition hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed bg-green-600 text-white hover:bg-green-700 ${className}`}
        data-testid="button-subscribe"
      >
        {loading ? "Processing..." : label}
      </button>
      {error && (
        <p className="text-sm text-red-600" data-testid="error-message">{error}</p>
      )}
    </div>
  );
};

export interface ManageBillingButtonProps {
  customerId: string;
  className?: string;
  label?: string;
}

export const ManageBillingButton: React.FC<ManageBillingButtonProps> = ({ 
  customerId, 
  className = "", 
  label = "Manage Billing" 
}) => {
  const [loading, setLoading] = useState(false);

  const openPortal = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId }),
      });
      
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // Stripe Customer Portal
      } else {
        alert(data.error || "Could not open billing portal.");
      }
    } catch (err) {
      console.error("Portal error", err);
      alert("Something went wrong opening the billing portal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={openPortal}
      disabled={loading}
      className={`px-4 py-2 rounded-xl bg-gray-900 text-white font-semibold shadow-md hover:bg-black disabled:opacity-60 ${className}`}
      data-testid="button-manage-billing"
    >
      {loading ? "Loading..." : label}
    </button>
  );
};

export interface TournamentEntryButtonProps {
  userId: string;
  tournamentId: string;
  userEmail?: string;
  className?: string;
  label?: string;
}

export const TournamentEntryButton: React.FC<TournamentEntryButtonProps> = ({
  userId,
  tournamentId,
  userEmail,
  className = "",
  label = "Enter Tournament (No Membership Required)"
}) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleEntry = async () => {
    try {
      setLoading(true);
      setMessage(null);

      const res = await fetch('/api/tournaments/entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, tournamentId, userEmail })
      });

      const data = await res.json();
      
      if (data.alreadyRegistered) {
        setMessage('You are already registered for this tournament!');
      } else if (data.comped) {
        setMessage('Tournament entry comped - you are in!');
      } else if (data.url) {
        window.location.href = data.url; // Stripe Checkout
      } else {
        setMessage(data.error || 'Could not start entry process');
      }
    } catch (err: any) {
      console.error('Tournament entry error', err);
      setMessage('Something went wrong starting tournament entry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        onClick={handleEntry}
        disabled={loading}
        className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed bg-yellow-500 text-black hover:bg-yellow-600 ${className}`}
        data-testid="button-tournament-entry"
      >
        {loading ? "Processing..." : label}
      </button>
      {message && (
        <p className="text-sm text-green-600" data-testid="entry-message">{message}</p>
      )}
    </div>
  );
};