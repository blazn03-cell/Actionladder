#!/usr/bin/env node

/**
 * Stripe Catalog Creation Script for Action Ladder Billiards
 * 
 * Usage:
 * For TEST: STRIPE_SECRET_KEY=sk_test_... node scripts/createStripeCatalog.mjs
 * For LIVE: STRIPE_SECRET_KEY=sk_live_... node scripts/createStripeCatalog.mjs
 */

import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.error('❌ STRIPE_SECRET_KEY environment variable is required');
  process.exit(1);
}

const isLive = stripeSecretKey.startsWith('sk_live_');
console.log(`🎱 Creating Stripe catalog for ${isLive ? 'LIVE' : 'TEST'} environment...`);

const stripe = new Stripe(stripeSecretKey);

async function createProducts() {
  const products = [
    {
      name: 'Small Monthly Membership',
      description: 'Monthly membership for reduced commission rates (5% vs 15%)',
      prices: [
        { amount: 2500, interval: 'month' } // $25/month
      ]
    },
    {
      name: 'Pro Monthly Membership', 
      description: 'Premium monthly membership with advanced features',
      prices: [
        { amount: 4500, interval: 'month' } // $45/month
      ]
    },
    {
      name: 'Tournament Entry',
      description: 'Entry fee for tournament participation',
      prices: [
        { amount: 6000 } // $60 one-time
      ]
    },
    {
      name: 'Walk-In Entry',
      description: 'Walk-in entry fee for casual play',
      prices: [
        { amount: 1200 } // $12 one-time
      ]
    },
    {
      name: 'Deposit',
      description: 'Refundable deposit for tournament entry',
      prices: [
        { amount: 3000 } // $30 one-time
      ]
    },
    {
      name: 'Analytics Add-on',
      description: 'Advanced player analytics and insights',
      prices: [
        { amount: 2000, interval: 'month' } // $20/month add-on
      ]
    }
  ];

  const createdProducts = {};

  for (const productData of products) {
    try {
      // Create product
      const product = await stripe.products.create({
        name: productData.name,
        description: productData.description,
        type: 'service'
      });

      console.log(`✅ Created product: ${product.name} (${product.id})`);

      // Create prices for this product
      const prices = [];
      for (const priceData of productData.prices) {
        const priceParams = {
          product: product.id,
          unit_amount: priceData.amount,
          currency: 'usd'
        };

        if (priceData.interval) {
          priceParams.recurring = { interval: priceData.interval };
        }

        const price = await stripe.prices.create(priceParams);
        prices.push(price);
        
        const priceType = priceData.interval ? `${priceData.interval}ly` : 'one-time';
        console.log(`  💰 Created price: $${priceData.amount / 100} ${priceType} (${price.id})`);
      }

      createdProducts[productData.name] = {
        product,
        prices
      };

    } catch (error) {
      console.error(`❌ Error creating ${productData.name}:`, error.message);
    }
  }

  return createdProducts;
}

async function displayConfig(products) {
  console.log('\n🎯 PRICE IDS FOR YOUR .env FILE:');
  console.log('=====================================');
  
  for (const [productName, data] of Object.entries(products)) {
    const envName = productName.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    data.prices.forEach((price, index) => {
      const suffix = data.prices.length > 1 ? `_${index + 1}` : '';
      console.log(`STRIPE_PRICE_${envName}${suffix}=${price.id}`);
    });
  }

  console.log('\n📋 COPY THIS TO YOUR PRODUCTION README:');
  console.log('=========================================');
  console.log(`Environment: ${isLive ? 'PRODUCTION' : 'TEST'}`);
  console.log(`Created: ${new Date().toISOString()}`);
  console.log('\nProducts & Prices:');
  
  for (const [productName, data] of Object.entries(products)) {
    console.log(`\n${productName}:`);
    console.log(`  Product ID: ${data.product.id}`);
    data.prices.forEach((price, index) => {
      const amount = `$${price.unit_amount / 100}`;
      const type = price.recurring ? `/${price.recurring.interval}` : ' one-time';
      console.log(`  Price ${index + 1}: ${price.id} (${amount}${type})`);
    });
  }
}

async function main() {
  try {
    const products = await createProducts();
    await displayConfig(products);
    console.log('\n🚀 Stripe catalog creation complete!');
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

main();