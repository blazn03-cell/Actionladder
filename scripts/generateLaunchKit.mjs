#!/usr/bin/env node

/**
 * Launch Kit Generator for Action Ladder Billiards
 * Creates QR codes and operator materials for go-live
 */

import fs from 'fs';
import path from 'path';

// Payment URLs from your live deployment
const PAYMENT_LINKS = {
  'Small Monthly': 'https://checkout.stripe.com/c/pay/YOUR_LIVE_SMALL_MONTHLY_SESSION',
  'Tournament Entry': 'https://checkout.stripe.com/c/pay/YOUR_LIVE_TOURNAMENT_SESSION', 
  'Walk-In Entry': 'https://checkout.stripe.com/c/pay/YOUR_LIVE_WALKIN_SESSION'
};

const APP_URL = process.env.APP_BASE_URL || 'https://YOURDOMAIN.com';

function generateQRCodeURLs() {
  console.log('🎯 QR CODE URLS FOR LAUNCH KIT');
  console.log('===============================\n');
  
  Object.entries(PAYMENT_LINKS).forEach(([name, url]) => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
    console.log(`${name}:`);
    console.log(`Payment URL: ${url}`);
    console.log(`QR Code: ${qrUrl}`);
    console.log('');
  });
}

function generateOperatorInstructions() {
  const instructions = `
# 🎱 HOW TO START A LADDER - Quick Setup Guide

## Step 1: Create Your Tournament
1. Visit ${APP_URL}/dashboard
2. Click "Create Tournament" 
3. Set entry fee, max players, and rules
4. Share the tournament link or QR code

## Step 2: Collect Entries
- **Walk-ins**: Use QR code for $12 instant entry
- **Tournaments**: Direct players to $60 entry link
- **Members**: Get 5% reduced commission vs 15% for non-members

## Step 3: Manage & Play
1. Check waitlist in admin dashboard
2. Promote players when spots open
3. Generate bracket when full
4. Update results as matches complete

## Step 4: Payouts
- Winners get paid automatically via Stripe
- View financial summary in admin panel
- Export player data for records

## Support & Refunds
- **Email**: support@actionladder.com
- **Refund Policy**: Tournament entries refundable until bracket locks
- **Emergency**: Contact hall operator or visit /refund

## Payment Methods
✅ All major credit cards
✅ Apple Pay & Google Pay  
✅ Automatic receipts via email
✅ Secure processing by Stripe

---
*In here, respect is earned in racks, not words* 🎱
`;

  return instructions;
}

function generateCounterDisplay() {
  const display = `
╔══════════════════════════════════════════════════════════════╗
║                    🎱 ACTION LADDER 🎱                       ║
║              Tri-City Texas Billiards System                 ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  💳 PAYMENT OPTIONS:                                         ║
║                                                              ║
║  📱 Walk-In Entry .................... $12                  ║
║      [QR CODE HERE]                                          ║
║                                                              ║
║  🏆 Tournament Entry ................ $60                   ║
║      [QR CODE HERE]                                          ║
║                                                              ║
║  ⭐ Monthly Membership .............. $25/month              ║
║      (5% commission vs 15% for non-members)                  ║
║      [QR CODE HERE]                                          ║
║                                                              ║
║  💡 RULES:                                                   ║
║  • Skill-based competition only                             ║
║  • No gambling or wagering                                  ║
║  • Tournament entries refundable until bracket locks        ║
║  • Respect is earned in racks, not words                    ║
║                                                              ║
║  🆘 SUPPORT: support@actionladder.com                       ║
║     Full policies: ${APP_URL}/terms               ║
╚══════════════════════════════════════════════════════════════╝
`;

  return display;
}

function generateWebhookTestScript() {
  const script = `#!/bin/bash
# Webhook Health Check Script
# Run this daily to verify webhook delivery

DOMAIN="https://YOURDOMAIN.com"
WEBHOOK_URL="$DOMAIN/api/stripe/webhook"

echo "🔍 Testing webhook endpoint..."

# Test health endpoint
health_status=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN/healthz")
if [ "$health_status" = "200" ]; then
    echo "✅ Health endpoint OK"
else
    echo "❌ Health endpoint failed: $health_status"
fi

# Test webhook endpoint (should return 400 without signature)
webhook_status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$WEBHOOK_URL")
if [ "$webhook_status" = "400" ]; then
    echo "✅ Webhook endpoint responding (400 expected without signature)"
else
    echo "❌ Webhook endpoint issue: $webhook_status"
fi

echo "📊 Check Stripe Dashboard → Events for delivery status"
echo "🎯 Target: >99% delivery success rate"
`;

  return script;
}

function main() {
  console.log('🚀 GENERATING LAUNCH KIT FOR ACTION LADDER');
  console.log('==========================================\n');

  // Create launch kit directory
  const launchDir = 'launch-kit';
  if (!fs.existsSync(launchDir)) {
    fs.mkdirSync(launchDir);
  }

  // Generate QR codes
  generateQRCodeURLs();

  // Save operator instructions
  fs.writeFileSync(
    path.join(launchDir, 'operator-instructions.md'),
    generateOperatorInstructions()
  );
  console.log('✅ Created operator-instructions.md');

  // Save counter display
  fs.writeFileSync(
    path.join(launchDir, 'counter-display.txt'),
    generateCounterDisplay()
  );
  console.log('✅ Created counter-display.txt');

  // Save webhook test script
  fs.writeFileSync(
    path.join(launchDir, 'webhook-health-check.sh'),
    generateWebhookTestScript()
  );
  fs.chmodSync(path.join(launchDir, 'webhook-health-check.sh'), '755');
  console.log('✅ Created webhook-health-check.sh');

  console.log('\\n🎯 LAUNCH KIT READY!');
  console.log('Files created in ./launch-kit/');
  console.log('\\n📋 TODO BEFORE GO-LIVE:');
  console.log('1. Update PAYMENT_LINKS with your live Stripe checkout URLs');
  console.log('2. Replace YOURDOMAIN.com with your actual domain');
  console.log('3. Print QR codes and counter display');
  console.log('4. Test webhook health check script');
}

main();