# Action Ladder Billiards

## Project Overview
Dark, gritty billiards tournament ladder system with live streaming integration, Stripe payment processing, and extensive player support features. Built with React, TypeScript, Express, and Tailwind CSS.

## Core Features
- **Player Ladder System**: Rankings, points, wins/losses tracking
- **Live Streaming Integration**: Twitch/YouTube embeds with live status
- **Stripe Payment Processing**: Secure checkout for tournaments and memberships
- **Special Events**: Birthday bonuses, charity nights, player support programs
- **QR Code Join Flow**: Easy player registration via mobile
- **Automated Poster Generator**: One-click fight night poster creation
- **Respect Points System**: Community recognition beyond just winning

## Theme & Branding
- **Slogan**: "In here, respect is earned in racks, not words"
- **Aesthetic**: Dark, gritty green theme representing pool hall atmosphere
- **Color Scheme**: Black backgrounds with bright green (#00ff00) accents
- **Typography**: Monospace fonts for that underground tech feel

## Betting & Financial Features
- **Betting Range**: $60 minimum to $500,000 maximum for qualified high-stakes players
- **Commission Structure**: 5% for members, 15% for non-members
- **Membership Tiers**: Basic ($25/month), Pro ($40/month)
- **Payment Methods**: Stripe integration with test mode enabled

## Special Community Features
- **Birthday Month Benefits**: Free tournament entry, $25 bonus if they win, special recognition
- **Family Support System**: Free passes for players going through tough times
- **Charity Nights**: Percentage of pots donated to community causes
- **Player in Need Rule**: Emergency support for struggling players (max $100)
- **Respect Points**: Earned through good sportsmanship and community contributions

## Technical Architecture
- **Frontend**: React 18 with TypeScript, Wouter routing, TanStack Query
- **Backend**: Express.js with in-memory storage (MemStorage)
- **Styling**: Tailwind CSS with custom dark theme
- **Payments**: Stripe Checkout API integration
- **Database**: PostgreSQL available (currently using memory storage)

## User Preferences
- **Communication Style**: Concise, professional, no emojis in code
- **Code Style**: TypeScript strict mode, functional components, proper error handling
- **Theme**: Dark mode preferred, green accent colors for billiards aesthetic

## Recent Changes
- Updated slogan to reflect street hustle mentality
- Increased betting limits to accommodate high-stakes players
- Added Stripe Checkout API integration with proper price IDs
- Implemented dark green pool hall theme throughout
- Created comprehensive player support and community features

## Development Setup
- Uses Vite for frontend development server
- Express backend on port 3000
- Frontend on port 5173 with proxy to backend
- TypeScript strict mode enabled
- Tailwind CSS for styling

## Key Files
- `shared/schema.ts`: Data models and validation
- `server/storage.ts`: In-memory data storage
- `server/routes.ts`: API endpoints including Stripe integration
- `client/src/App.tsx`: Main application with navigation
- `client/src/pages/`: Individual page components
- `client/src/index.css`: Custom CSS with pool hall theme

## Environment Variables Needed
- `STRIPE_SECRET_KEY`: Stripe API secret key
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook endpoint secret
- `STRIPE_PUBLISHABLE_KEY`: Stripe public key for frontend

## Payment Integration
Uses Stripe Checkout Sessions API with:
- One-time payments for tournaments/entries
- Subscription billing for memberships
- Webhook handling for payment confirmation
- Metadata tracking for payment types and user tiers