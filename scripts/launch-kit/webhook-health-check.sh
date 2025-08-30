#!/bin/bash
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
