/**
 * PayMongo API integration
 * Docs: https://developers.paymongo.com
 *
 * Amounts are in centavos (PHP * 100). Example: 500 PHP = 50000
 */

const PAYMONGO_API = 'https://api.paymongo.com/v1';

function getSecretKey() {
  const key = process.env.PAYMONGO_SECRET_KEY;
  if (!key || !key.startsWith('sk_')) {
    throw new Error('PAYMONGO_SECRET_KEY is required and must start with sk_');
  }
  return key;
}

function getPublicKey() {
  const key = process.env.PAYMONGO_PUBLIC_KEY;
  if (!key || !key.startsWith('pk_')) {
    throw new Error('PAYMONGO_PUBLIC_KEY is required and must start with pk_');
  }
  return key;
}

function getAuthHeader(secret = true) {
  const key = secret ? getSecretKey() : getPublicKey();
  const encoded = Buffer.from(key + ':').toString('base64');
  return 'Basic ' + encoded;
}

/**
 * Create a Payment Intent (for card payments)
 * @param {Object} opts
 * @param {number} opts.amount - Amount in centavos
 * @param {string} opts.currency - e.g. 'PHP'
 * @param {string} opts.orderId
 * @param {string} opts.subdomain
 * @param {string} [opts.description]
 * @returns {Promise<{ clientKey: string, id: string }>}
 */
async function createPaymentIntent({ amount, currency = 'PHP', orderId, subdomain, description }) {
  const body = {
    data: {
      attributes: {
        amount: Math.max(2000, Math.round(amount)),
        currency: String(currency || 'PHP').toUpperCase(),
        payment_method_allowed: ['card', 'gcash', 'paymaya', 'grab_pay'],
        description: description || `Order ${orderId}`,
        metadata: {
          order_id: String(orderId),
          subdomain: String(subdomain || ''),
        },
      },
    },
  };

  const res = await fetch(`${PAYMONGO_API}/payment_intents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: getAuthHeader(true),
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (!res.ok) {
    const err = json?.errors?.[0] || json?.message || 'PayMongo API error';
    throw new Error(typeof err === 'object' ? JSON.stringify(err) : err);
  }

  const attrs = json?.data?.attributes || {};
  const id = json?.data?.id;
  if (!id || !attrs.client_key) {
    throw new Error('Invalid PayMongo response');
  }

  return { clientKey: attrs.client_key, id };
}

/**
 * Create a Source (for GCash / GrabPay redirect flow)
 * @param {Object} opts
 * @param {number} opts.amount - Amount in centavos (min 10000 = PHP 100)
 * @param {string} opts.currency
 * @param {string} opts.type - 'gcash' | 'grab_pay'
 * @param {string} opts.successUrl
 * @param {string} opts.failedUrl
 * @param {Object} opts.metadata - { order_id, subdomain }
 * @returns {Promise<{ redirectUrl: string, id: string }>}
 */
async function createSource({ amount, currency = 'PHP', type, successUrl, failedUrl, metadata = {} }) {
  const body = {
    data: {
      attributes: {
        amount: Math.max(10000, Math.round(amount)),
        currency: String(currency || 'PHP').toUpperCase(),
        type: type === 'maya' ? 'paymaya' : String(type || 'gcash'),
        redirect: {
          success: successUrl,
          failed: failedUrl,
        },
        metadata: Object.fromEntries(
          Object.entries(metadata).map(([k, v]) => [k, String(v)])
        ),
      },
    },
  };

  const res = await fetch(`${PAYMONGO_API}/sources`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: getAuthHeader(false),
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (!res.ok) {
    const err = json?.errors?.[0] || json?.message || 'PayMongo API error';
    throw new Error(typeof err === 'object' ? JSON.stringify(err) : err);
  }

  const attrs = json?.data?.attributes || {};
  const id = json?.data?.id;
  const redirectUrl = attrs.redirect?.checkout_url;
  if (!id || !redirectUrl) {
    throw new Error('Invalid PayMongo source response');
  }

  return { redirectUrl, id };
}

/**
 * Create a Payment from a chargeable Source (call when source.chargeable webhook fires)
 * @param {Object} opts
 * @param {string} opts.sourceId
 * @param {number} opts.amount
 * @param {string} opts.currency
 * @returns {Promise<{ id: string }>}
 */
async function createPaymentFromSource({ sourceId, amount, currency = 'PHP' }) {
  const body = {
    data: {
      attributes: {
        amount: Math.max(2000, Math.round(amount)),
        currency: String(currency || 'PHP').toUpperCase(),
        source: {
          id: sourceId,
          type: 'source',
        },
      },
    },
  };

  const res = await fetch(`${PAYMONGO_API}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: getAuthHeader(true),
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (!res.ok) {
    const err = json?.errors?.[0] || json?.message || 'PayMongo API error';
    throw new Error(typeof err === 'object' ? JSON.stringify(err) : err);
  }

  const id = json?.data?.id;
  if (!id) throw new Error('Invalid PayMongo payment response');
  return { id };
}

/**
 * Verify PayMongo webhook signature (Paymongo-Signature: t=timestamp,v1=hex)
 * @param {string} rawBody - Raw request body (string)
 * @param {string} signatureHeader - Paymongo-Signature header value
 * @returns {boolean}
 */
function verifyWebhookSignature(rawBody, signatureHeader) {
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET;
  if (!secret) return false;
  if (!rawBody || !signatureHeader) return false;

  try {
    const crypto = require('crypto');
    const parts = {};
    for (const p of signatureHeader.split(',')) {
      const eq = p.indexOf('=');
      if (eq > 0) parts[p.slice(0, eq).trim()] = p.slice(eq + 1).trim();
    }
    const timestamp = parts.t;
    const sig = parts.v1 || parts.s;
    if (!timestamp || !sig) return false;

    const payload = timestamp + '.' + rawBody;
    const computed = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    if (computed.length !== sig.length) return false;
    return crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(sig, 'hex'));
  } catch {
    return false;
  }
}

module.exports = {
  createPaymentIntent,
  createSource,
  createPaymentFromSource,
  verifyWebhookSignature,
  getPublicKey: () => (process.env.PAYMONGO_PUBLIC_KEY || '').trim(),
};
