const log = require('../utils/logger')('stripeService');

let stripeClient = null;

function getStripeClient() {
  if (stripeClient) return stripeClient;
  const secretKey = String(process.env.STRIPE_SECRET_KEY || '').trim();
  if (!secretKey) return null;
  log.info(`Initializing with key prefix: ${secretKey.substring(0, 7)}...`);
  stripeClient = require('stripe')(secretKey);
  return stripeClient;
}

function requireStripeClient() {
  const client = getStripeClient();
  if (!client) {
    throw new Error('Stripe not configured: STRIPE_SECRET_KEY is missing');
  }
  return client;
}

/**
 * Stripe API integration
 * Docs: https://stripe.com/docs/api
 */

/**
 * Create a Stripe Payment Intent
 * @param {Object} opts
 * @param {number} opts.amount - Amount in smallest currency unit (e.g., centavos for PHP)
 * @param {string} opts.currency - e.g. 'php'
 * @param {string} opts.orderId
 * @param {string} opts.subdomain
 * @returns {Promise<Object>}
 */
async function createPaymentIntent({ amount, currency = 'php', orderId, subdomain }) {
  try {
    const stripe = requireStripeClient();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: currency.toLowerCase(),
      metadata: {
        order_id: String(orderId),
        subdomain: String(subdomain || ''),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });
    return paymentIntent;
  } catch (error) {
    log.error('Stripe Payment Intent Error:', error);
    throw error;
  }
}

/**
 * Verify Stripe Webhook Signature
 * @param {Buffer} rawBody 
 * @param {string} sig 
 * @returns {Object} event
 */
function constructEvent(rawBody, sig) {
  const stripe = requireStripeClient();
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!String(endpointSecret || '').trim()) {
    throw new Error('Stripe not configured: STRIPE_WEBHOOK_SECRET is missing');
  }
  return stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
}

/**
 * Create a Stripe Setup Intent for saving payment methods
 * @param {Object} opts
 * @param {string} opts.userId
 * @returns {Promise<Object>}
 */
async function createSetupIntent({ userId }) {
  try {
    const stripe = requireStripeClient();
    const setupIntent = await stripe.setupIntents.create({
      metadata: {
        user_id: String(userId),
      },
      payment_method_types: ['card'],
    });
    return setupIntent;
  } catch (error) {
    log.error('Stripe Setup Intent Error:', error);
    throw error;
  }
}

module.exports = {
  createPaymentIntent,
  createSetupIntent,
  constructEvent,
  getPublicKey: () => (process.env.STRIPE_PUBLIC_KEY || '').trim(),
};
