// controllers/webhookController.js
const paymongoService = require('../services/paymongoService');
const stripeService = require('../services/stripeService');
const StorefrontOrder = require('../models/StorefrontOrder');
const log = require('../utils/logger')('webhookController');

/**
 * Xendit webhook handler.
 * Events: invoice.paid
 * Verify x-callback-token header.
 */
exports.xenditWebhook = async (req, res) => {
  try {
    const token = req.headers['x-callback-token'];
    if (!xenditService.verifyWebhookToken(token)) {
      return res.status(401).json({ success: false, message: 'Invalid webhook token' });
    }

    const payload = req.body;
    const status = payload?.status;
    const externalId = payload?.external_id;

    if (status !== 'PAID' || !externalId) {
      return res.status(200).json({ received: true });
    }

    // external_id format: subdomain:orderId
    const parts = String(externalId).split(':');
    if (parts.length < 2) {
      return res.status(200).json({ received: true });
    }
    const subdomain = parts[0].trim();
    const orderId = parts.slice(1).join(':').trim();
    if (!subdomain || !orderId) {
      return res.status(200).json({ received: true });
    }

    const updated = await StorefrontOrder.updateStatusBySubdomainAndId(subdomain, orderId, 'Paid');
    if (!updated) {
      return res.status(200).json({ received: true });
    }

    res.status(200).json({ received: true });
  } catch (error) {
    log.error('[webhook] xendit error:', error.message);
    res.status(500).json({ success: false, message: 'Webhook error' });
  }
};

/**
 * PayMongo webhook handler.
 * Requires req.rawBody (set by express.json verify callback) for signature verification.
 * Events: payment_intent.succeeded, source.chargeable, payment.paid
 */
exports.paymongoWebhook = async (req, res) => {
  try {
    const rawBody = req.rawBody;
    const signature = req.headers['paymongo-signature'] || req.headers['Paymongo-Signature'];

    if (!rawBody || !signature) {
      return res.status(400).json({ success: false, message: 'Missing body or signature' });
    }

    const rawStr = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    if (!paymongoService.verifyWebhookSignature(rawStr, signature)) {
      return res.status(401).json({ success: false, message: 'Invalid signature' });
    }

    const payload = req.body;
    const event = payload?.data?.attributes?.event;
    const resource = payload?.data?.attributes?.data;

    if (!event || !resource) {
      return res.status(400).json({ success: false, message: 'Invalid payload' });
    }

    let orderId, subdomain;

    if (event === 'payment_intent.succeeded') {
      const meta = resource?.attributes?.metadata || {};
      orderId = meta.order_id;
      subdomain = meta.subdomain;
    } else if (event === 'source.chargeable') {
      const meta = resource?.attributes?.metadata || {};
      orderId = meta.order_id;
      subdomain = meta.subdomain;

      if (orderId && subdomain) {
        const order = await StorefrontOrder.findById(subdomain, orderId);
        if (order && order.status === 'Pending') {
          const amount = Math.round((order.total || 0) * 100);
          const currency = order.currency || 'PHP';
          await paymongoService.createPaymentFromSource({
            sourceId: resource.id,
            amount: Math.max(2000, amount),
            currency,
          });
        }
      }
    } else if (event === 'payment.paid') {
      const meta = resource?.attributes?.metadata || {};
      orderId = meta.order_id;
      subdomain = meta.subdomain;
    }

    if (event !== 'payment_intent.succeeded' && event !== 'source.chargeable' && event !== 'payment.paid') {
      return res.status(200).json({ received: true });
    }

    if (!orderId || !subdomain) {
      return res.status(200).json({ received: true });
    }

    const updated = await StorefrontOrder.updateStatusBySubdomainAndId(subdomain, orderId, 'Paid');
    if (!updated) {
      return res.status(200).json({ received: true });
    }

    res.status(200).json({ received: true });
  } catch (error) {
    log.error('[webhook] paymongo error:', error.message);
    res.status(500).json({ success: false, message: 'Webhook error' });
  }
};

/**
 * Stripe webhook handler.
 */
exports.stripeWebhook = async (req, res) => {
  let event;
  try {
    const rawBody = req.rawBody;
    const signature = req.headers['stripe-signature'];

    if (!rawBody || !signature) {
      return res.status(400).json({ success: false, message: 'Missing body or signature' });
    }

    try {
      event = stripeService.constructEvent(rawBody, signature);
    } catch (err) {
      log.error(`[webhook] stripe signature verification failed:`, err.message);
      if (err.statusCode === 503) {
        return res.status(503).json({ success: false, message: err.message });
      }
      return res.status(401).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        const { order_id: PIOrderId, subdomain: PISubdomain } = paymentIntent.metadata;
        if (PIOrderId && PISubdomain) {
          await StorefrontOrder.updateStatusBySubdomainAndId(PISubdomain, PIOrderId, 'Paid');
          log.info(`[webhook] stripe payment_intent.succeeded: ${PIOrderId} (${PISubdomain})`);
        }
        break;
      case 'checkout.session.completed':
        const session = event.data.object;
        const { order_id: SOrderId, subdomain: SSubdomain } = session.metadata;
        if (SOrderId && SSubdomain) {
          await StorefrontOrder.updateStatusBySubdomainAndId(SSubdomain, SOrderId, 'Paid');
          log.info(`[webhook] stripe checkout.session.completed: ${SOrderId} (${SSubdomain})`);
        }
        break;
      default:
        log.info(`[webhook] stripe unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    log.error('[webhook] stripe error:', error.message);
    res.status(500).json({ success: false, message: 'Webhook error' });
  }
};
