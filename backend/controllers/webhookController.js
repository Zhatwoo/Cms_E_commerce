// controllers/webhookController.js
const paymongoService = require('../services/paymongoService');
const StorefrontOrder = require('../models/StorefrontOrder');

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
    console.error('[webhook] paymongo error:', error.message);
    res.status(500).json({ success: false, message: 'Webhook error' });
  }
};
