# 🚀 Production Deployment Guide - Action Ladder Billiards

## 🔥 GO-LIVE CHECKLIST

### 0️⃣ Snapshot & Freeze ✅
**YOU NEED TO DO:**
```bash
# Create version tag
git add -A
git commit -m "feat: v1.0.0 - Complete billiards system ready for production"
git tag v1.0.0
git push origin v1.0.0

# Database backup (if using external DB)
pg_dump your_db > backup_v1.0.0_$(date +%Y%m%d).sql
```

### 1️⃣ Create LIVE Stripe Catalog ✅
**Script Ready:** `scripts/createStripeCatalog.mjs`

```bash
# Run with your LIVE Stripe key
export STRIPE_SECRET_KEY=sk_live_********
node scripts/createStripeCatalog.mjs
```

Copy the output Price IDs to your production environment.

### 2️⃣ Production Environment Variables
**Update your .env file:**
```bash
# Stripe LIVE keys
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_live_...  # Get from step 3

# Production URLs
APP_BASE_URL=https://YOURDOMAIN.com

# Database (if external)
DATABASE_URL=postgresql://...

# OpenAI (keep existing)
OPENAI_API_KEY=sk-...
```

### 3️⃣ LIVE Webhook Setup
**Stripe Dashboard → Developers → Webhooks → + Add endpoint**

- **URL:** `https://YOURDOMAIN.com/api/stripe/webhook`
- **Events to send:**
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated` 
  - `customer.subscription.deleted`
  - `invoice.paid`
  - `invoice.payment_failed`
  - `customer.subscription.trial_will_end` (optional)

Copy the **signing secret** (whsec_...) to your `.env` file above.

### 4️⃣ Production Smoke Tests
**Test with REAL card (small amounts):**

1. **Walk-In $12** → Verify redirect & webhook 200 OK
2. **Small Monthly** → Verify subscription active  
3. **Deposit $30** → Charge then refund via dashboard
4. **Cancel subscription** → Test Customer Portal

**Test Card for Final Verification:** Use a real card with small amounts, then refund immediately.

### 5️⃣ Stripe Business Settings
**Dashboard → Settings:**

- **Payouts:** Connect bank account, set payout schedule
- **Public details:**
  - Business name: `Action Ladder`
  - Statement descriptor: `ACTION LADDER` (≤22 chars)
  - Support email/phone
- **Receipts:** Enable email receipts for charges & refunds

### 6️⃣ Fraud Protection (Radar)
**Dashboard → Radar:**

```javascript
// Recommended rules (start conservative)
Block when :risk_level = 'highest'
Require 3DS when :risk_level = 'elevated' 
For first-time customers AND amount ≥ $300 → require 3DS
```

Enable 3D Secure when risk is elevated.

### 7️⃣ Legal Pages Verification ✅
**Already live at:**
- `/terms` - ✅ Includes "skill-based competitions only"
- `/privacy` - ✅ Stripe payment processing disclosed  
- `/refund` - ✅ Clear refund policies
- `/acceptable-use` - ✅ No gambling/wagering policy

### 8️⃣ Monitoring & Backups
**Add to your infrastructure:**

```bash
# Health check monitoring
curl https://YOURDOMAIN.com/healthz  # Should return "ok"

# Error tracking (recommended: Sentry)
# Uptime monitoring (recommended: UptimeRobot)

# Nightly DB backup
0 2 * * * pg_dump your_db > backup_$(date +\%Y\%m\%d).sql

# Stripe webhook monitoring  
Dashboard → Developers → Events → Enable email alerts
```

### 9️⃣ Operator Launch Kit

**Payment Links (Generated):**
- Small Monthly: `[Your live checkout URL]`
- Tournament $60: `[Your live checkout URL]` 
- Walk-In $12: `[Your live checkout URL]`

**Print & Display:**
- QR codes for each payment link
- "How to start a ladder" instructions
- Support email & refund policy
- Tournament rules poster

### 🔟 Post-Launch Monitoring (Days 1-7)

**Track Daily:**
- New operator signups
- ARPU (Average Revenue Per User)
- Entry volume & conversion rates
- Refund rate (target: <5%)
- Dispute rate (target: <1%)

**Stripe Dashboard Checks:**
- Radar decisions (adjust rules if needed)
- Webhook delivery success rate
- Failed payment patterns

## 🛡️ Dispute Evidence Template

**Save this for when disputes occur:**

```
ORDER DETAILS:
- Charge ID: [ch_xxx]
- Customer Email: [email]
- Date/Time: [timestamp]
- Amount: $XX.XX
- Product: [Tournament Entry/Membership]

PROOF OF SERVICE:
- Digital access provided: [login timestamp]
- Tournament participation: [bracket/results]
- Service delivery: [match completion]

BUSINESS MODEL:
- Skill-based competition (no gambling)
- Clear refund policy displayed
- Customer agreed to terms

SUPPORTING EVIDENCE:
- Screenshots: Receipt, rules, refund policy
- Customer communication logs
- IP address & device info
- Tournament bracket/results
```

## 🚨 Emergency Contacts

**If anything goes wrong:**
- Stripe Support: https://support.stripe.com
- Webhook issues: Check signing secret & endpoint URL
- Payment failures: Verify live keys are correct
- Disputes: Respond within 7 days with evidence above

## ✅ Ready for Production

Your billiards application is feature-complete with:
- ✅ Comprehensive AI features
- ✅ Secure Stripe payment processing  
- ✅ Legal compliance (Terms, Privacy, etc.)
- ✅ Webhook handling & monitoring
- ✅ Health endpoints for uptime monitoring
- ✅ Dark, professional pool hall theme

**Next:** Execute the checklist above to go live! 🎱