ActionLadder Launch Checklist - Quick Reference
Last Updated: December 15, 2025
Estimated Launch Window: 3-4 weeks from today

🔴 CRITICAL BLOCKERS (Must Fix Before Launch)
Week 1: Foundation Setup
[x] Mobile Assets
[x] Create mobile-app/assets/icon.png (1024x1024px, dark theme)
[x] Create mobile-app/assets/splash.png (1284x2778px)
[x] Create mobile-app/assets/favicon.png (48x48px)
Time: 2-4 hours | Blocker: Cannot build APK/IPA without
[ ] Domain Setup
[ ] Register domain (actionladder.com or similar)
[ ] Point DNS to hosting provider
[ ] Setup HTTPS/SSL certificates
Time: 1-2 hours | Blocker: Stripe requires HTTPS domain
[ ] Stripe LIVE Account
[ ] Create LIVE Stripe account (not test mode)
[ ] Get STRIPE_SECRET_KEY (sk_live_xxx)
[ ] Get STRIPE_PUBLISHABLE_KEY (pk_live_xxx)
[ ] Configure webhook endpoint → /api/stripe/webhook
[ ] Get webhook secret (whsec_live_xxx)
Time: 2-3 hours | Blocker: Production payments won't work
[ ] Database Setup
[ ] Provision PostgreSQL database (Railway, Supabase, etc.)
[ ] Get connection string: postgresql://user:pass@host/db
[ ] Test connection works
Time: 1 hour | Blocker: Data persistence required

🟡 HIGH PRIORITY (Week 1-2)
Environment Configuration

# Create .env.production with

NODE_ENV=production
DATABASE_URL=postgresql://...
APP_BASE_URL=<https://yourdomain.com>
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_live_...
OPENAI_API_KEY=sk-...
SENDGRID_API_KEY=SG...

# (Add any other required keys from .env.example)

[ ] Environment variables locked down (no secrets in code)
[ ] .env.production stored securely (1Password, LastPass, etc.)
[ ] Database migration executed: npm run db:push
[ ] Stripe catalog generated: node scripts/createStripeCatalog.mjs
Build & Test
[ ] Client Build
cd client && npm run build

# Verify: dist/ folder created, no errors

[ ] No TypeScript errors
[ ] No console warnings
[ ] Bundle size < 5MB
Time: 2 hours (including optimizations)
[ ] Server Build
cd server && npm run build

# Verify: dist/index.js created

npm start  # Should start on port 5000

[ ] No TypeScript errors
[ ] Health check: curl <http://localhost:5000/healthz>
[ ] Returns ok
Time: 1 hour
[ ] Database Schema
[ ] All 40+ tables created
[ ] Indexes applied
[ ] Sample data loaded
[ ] Backup verified
Time: 2 hours
Payment Testing (Stripe)
[ ] Walk-in fee ($12 charge)
[ ] Webhook received and logged
[ ] Transaction recorded in database
[ ] Player credit updated
[ ] Email sent to operator
[ ] Monthly subscription
[ ] Subscription created in Stripe
[ ] Operator access granted
[ ] Invoice generated
[ ] Renewal scheduled
[ ] Large deposit ($30)
[ ] Charge successful
[ ] Immediately refund via Stripe dashboard
[ ] Refund webhook received
[ ] Player credit returned
[ ] Cancel subscription
[ ] Subscription cancels in Stripe
[ ] Webhook processed
[ ] Operator loses access
[ ] Email notification sent
User Journey Testing
[ ] Player Signup
[ ] Email signup works
[ ] Email verification email sent
[ ] Can confirm email
[ ] Can login
[ ] Profile creation works
[ ] Operator Signup
[ ] Can create operator account
[ ] Hall information saved
[ ] Subscription tier selectable
[ ] Payment successful
[ ] Dashboard accessible
[ ] Challenge Creation
[ ] Can post challenge
[ ] Price validation works
[ ] Anti-ghosting lock-in works
[ ] Payment deducted
[ ] Other players can see challenge
[ ] Tournament Creation
[ ] Can create tournament
[ ] Players can join
[ ] Bracket generates correctly
[ ] Match entry works
[ ] Results update leaderboard

🟠 MEDIUM PRIORITY (Week 2)
Performance Optimization
[ ] Bundle Analysis
npm install -D webpack-bundle-analyzer

# Check: No large dependencies, proper code splitting

[ ] Caching Headers
[ ] Static assets cached (30 days)
[ ] API responses cached where appropriate
[ ] HTML cache-control: no-cache
[ ] Database Optimization
[ ] All queries indexed
[ ] No N+1 problems
[ ] Connection pooling configured
[ ] Load Testing
[ ] Simulate 100 concurrent users
[ ] P95 response time < 200ms
[ ] No connection pool exhaustion
[ ] No memory leaks
Mobile App Build
[ ] Android (APK for testing)
cd mobile-app
npm install
eas login
eas build --platform android --profile preview

# Download APK and test on 3+ devices

[ ] App loads correctly in WebView
[ ] All touches respond
[ ] Deep linking works (actionladder://...)
[ ] Camera functionality works
[ ] No crashes
[ ] Android (AAB for store)
eas build --platform android --profile production

# Ready for Google Play Console

[ ] iOS (IPA for TestFlight)
eas build --platform ios --profile production

# Deploy to TestFlight, test on iPhone/iPad

Monitoring Setup
[ ] Error Tracking
[ ] Sentry account created
[ ] Error tracking integrated
[ ] Alerts configured for critical errors
[ ] Threshold: Alert if >5 errors/hour
[ ] Uptime Monitoring
[ ] UptimeRobot configured
[ ] Checks every 5 minutes
[ ] Alert if downtime > 5 minutes
[ ] SMS alert to founder
[ ] Performance Monitoring
[ ] Response time tracking
[ ] Database query monitoring
[ ] Payment success rate tracking
[ ] Dashboard setup

🟢 NICE TO HAVE (Week 3)
Documentation & Runbooks
[ ] API Documentation
[ ] OpenAPI/Swagger spec created
[ ] All 50+ endpoints documented
[ ] Example requests/responses
[ ] Error codes documented
[ ] Deployment Runbook
[ ] Step-by-step deployment guide
[ ] Rollback procedure documented
[ ] Team members trained
[ ] Incident Response Plan
[ ] On-call rotation defined
[ ] Escalation procedures
[ ] Communication templates
Code Quality
[ ] Fix TODO Comments (2 items)
[ ] Premium subscription navigation (SideBetting.tsx:536)
[ ] Stripe integration test (EightFootLadderPage.tsx:431)
[ ] Add Unit Tests
[ ] Authentication tests
[ ] Payment controller tests
[ ] Player ladder calculation tests
[ ] Target: 50%+ coverage (can expand after launch)
[ ] Code Audit
[ ] Security review complete
[ ] No hardcoded secrets
[ ] All API keys from environment
[ ] No debug code in production
Legal & Compliance
[ ] Pages Verified
[ ] /terms - Updated with company info
[ ] /privacy - Privacy policy accurate
[ ] /refund - Clear refund policy
[ ] /acceptable-use - No gambling language
[ ] Support System
[ ] Email: <support@actionladder.com>
[ ] Response SLA: 24 hours
[ ] Ticketing system (Zendesk/HubSpot)
[ ] FAQ document created

📋 LAUNCH DAY CHECKLIST
Pre-Launch (T-2 hours)
[ ] All systems green on monitoring dashboard
[ ] Team members on standby
[ ] Slack alerts configured
[ ] Database backup verified
[ ] Support email monitored
[ ] Deployment script tested
[ ] Rollback plan reviewed
Launch (T-0)
[ ] Deploy to production
[ ] Verify health check: curl <https://yourdomain.com/healthz>
[ ] Test critical user journeys
[ ] Monitor error rate (should be <0.1%)
[ ] Monitor Stripe webhooks
[ ] Announce on social media (optional)
Post-Launch (T+24 hours)
[ ] Error rate stable (<0.1%)
[ ] No critical issues
[ ] Payment success rate >95%
[ ] Database performing well
[ ] Daily backup completed
[ ] First week support plan activated
Post-Launch (T+7 days)
[ ] Analyze metrics (signups, payments, errors)
[ ] Review support tickets
[ ] Plan next features
[ ] Schedule team retrospective

🚀 FAST TRACK TIMELINE
Option A: 3-Week Launch (Recommended)
Week 1: Critical blockers + setup
Week 2: Build, test, payment verification
Week 3: Performance, monitoring, final testing
Week 4: Launch
Option B: 2-Week Express Launch
Week 1: All critical blockers + builds
Week 2: Testing, monitoring setup, deploy
Risk: Less thorough testing, potential issues
Best for: Experienced teams only
Option C: 4-Week Thorough Launch
Week 1: Critical blockers
Week 2: Build and initial testing
Week 3: Performance optimization and mobile
Week 4: Final testing and launch
Best for: First-time production launch**

📊 GO/NO-GO DECISION CRITERIA
GO Criteria (All must be YES)
[ ] Mobile app builds successfully on both iOS & Android
[ ] Production database populated and migrated
[ ] Stripe LIVE webhooks receiving 100% of events
[ ] Payment test successful (charge + refund)
[ ] API response time <200ms p95
[ ] Error rate <0.5% for 24 hours
[ ] All legal pages complete and reviewed
[ ] Support team trained and ready
[ ] Monitoring alerts configured and tested
[ ] Backup/restore procedure tested
NO-GO Criteria (Any is red flag)
[ ] TypeScript compilation errors
[ ] Unresolved critical bugs in testing
[ ] Payment webhook failures >5%
[ ] Performance testing shows <95% uptime
[ ] Security audit identifies critical vulnerabilities
[ ] Legal review incomplete
[ ] Team unprepared for 24/7 support

💡 Quick Command Reference

# Environment Setup

export DATABASE_URL="postgresql://..."
export STRIPE_SECRET_KEY="sk_live_..."
export NODE_ENV="production"

# Build Everything

npm run install:all   # Install all dependencies
npm run build         # Build client + server
npm run check         # Type check everything

# Database

npm run db:push       # Migrate schema to production DB

# Stripe

node scripts/createStripeCatalog.mjs  # Sync Stripe products

# Mobile

cd mobile-app
npm install
eas login
eas build --platform android --profile preview
eas build --platform ios --profile production

# Local Testing

npm run dev           # Start dev servers
npm run start         # Start production server (after build)

# Health Checks

curl <http://localhost:5000/healthz>
curl <https://yourdomain.com/healthz>

📞 SUPPORT CONTACTS
Role
Responsibility
On-Call
Founder
Overall system, decisions
24/7 (Week 1)
Dev 1
Backend, database, DevOps
24/7 (Week 1)
Dev 2
Frontend, mobile, UI/UX
24/7 (Week 1)
Support
Customer issues, billing
Business hours initially

Support Email: <support@actionladder.com>
Slack Channel: #incidents (in product workspace)
Escalation Path: Support → Dev on-call → Founder

📈 SUCCESS CRITERIA (First 30 Days)
Metric
Target
Actions if Below Target
Uptime
99.9%
Increase infrastructure, fix issues
Error Rate
<0.1%
Investigate and patch
Payment Success
>98%
Check Stripe webhooks, debug flow
Player Signups
100+/week
Marketing/PR push
Support Tickets
<5/day
Improve documentation
Mobile App Rating
>4.5 stars
Fix reported issues quickly

Document Status: Ready to Use
Owner: [Project Lead]
Last Updated: December 15, 2025
