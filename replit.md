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
- **Side Betting System**: Credit-based wagering with closed-loop funds and pre-funding to prevent ghosting

## Side Betting System
Complete production-ready side betting infrastructure featuring:
- **Credit-Based Wagering**: Closed-loop system with wallet management and Stripe top-ups
- **Side Pot Creation**: Players create custom betting markets with configurable stakes and fees
- **Operator Controls**: Administrative dashboard for locking pots and resolving bets
- **Automated Resolution**: Winner determination with automatic payout distribution
- **Transaction Ledger**: Complete audit trail of all financial activities
- **Anti-Ghosting Protection**: Pre-funding requirement ensures all bets are backed by real credits
- **Service Fee Management**: Tiered fee structure (8.5% default, 5% for pots over $500)
- **Real-Time Updates**: Live betting status and pot tracking across all interfaces

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
- **Mobile App**: React Native with Expo (WebView wrapper)
- **Styling**: Tailwind CSS with custom dark theme
- **Payments**: Stripe Checkout API integration
- **Database**: PostgreSQL available (currently using memory storage)
- **Streaming**: Multi-platform live stream integration (Twitch, YouTube, Facebook, TikTok, Kick)

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
- Enhanced Live Streams with geographic filtering and 6 platform support
- Built complete React Native mobile app with Expo
- Added "Money on the Table" gambling game with multiple variants
- Integrated OCR capabilities with tesseract.js for tournament features
- **Implemented complete side betting system with credit-based wagering** (December 2024)
- Extended database schema for wallet management and side pot tracking
- Created comprehensive API infrastructure for betting operations and resolution
- Built React UI components for both user betting and operator management
- Integrated Stripe payment processing for wallet top-ups

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
- `DATABASE_URL`: PostgreSQL connection string (available)
- `SESSION_SECRET`: Session encryption key (available)
- `REPLIT_DOMAINS`: Deployment domains (available)

## Payment Integration
Uses Stripe Checkout Sessions API with:
- One-time payments for tournaments/entries
- Subscription billing for memberships
- Webhook handling for payment confirmation
- Metadata tracking for payment types and user tiers

## Mobile Application
React Native app built with Expo featuring:
- **WebView Integration**: Full web app in native mobile wrapper
- **Camera/Microphone Access**: OCR scanning, live streaming, match recording
- **Deep Linking**: actionladder:// URLs for sharing tournaments/matches
- **Push Notifications**: Tournament updates, match results, live stream alerts
- **Offline Support**: Cached content when internet unavailable
- **Store Deployment**: Ready for Google Play Store and Apple App Store
- **Location Services**: Find nearby pool halls and tournaments
- **Native Optimizations**: Touch gestures, keyboard handling, performance

### Mobile App Setup
1. Navigate to `mobile-app/` directory
2. Install dependencies: `npm install`
3. Update `APP_URL` in `App.js` to your deployment URL
4. Start development: `npm start`
5. Test with Expo Go app on your phone
6. Build for stores: `npm run build:android` or `npm run build:ios`

## Live Streaming Features
Comprehensive streaming platform with:
- **Multi-Platform Support**: Twitch, YouTube, Facebook, TikTok, Kick, Other
- **Geographic Discovery**: Filter streams by city, state, and pool hall
- **Stream Categories**: Tournament, casual, practice, special event
- **Quality Indicators**: HD, Full HD, 4K streaming support
- **Real-Time Stats**: Live viewer counts with peak tracking
- **Integration**: Connected with tournaments, matches, and player profiles
- **Operator Controls**: Stream management and moderation tools