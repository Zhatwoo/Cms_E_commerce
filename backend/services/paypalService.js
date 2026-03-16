/**
 * PayPal REST API integration
 * Docs: https://developer.paypal.com/docs/api/orders/v2/
 *
 * Flow: Create order → redirect to approve URL → user pays → capture on return
 */

const PAYPAL_SANDBOX = 'https://api-m.sandbox.paypal.com';
const PAYPAL_LIVE = 'https://api-m.paypal.com';

function getBaseUrl() {
  const sandbox = process.env.PAYPAL_SANDBOX !== 'false' && process.env.PAYPAL_SANDBOX !== '0';
  return sandbox ? PAYPAL_SANDBOX : PAYPAL_LIVE;
}

function getCredentials() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !secret) {
    throw new Error('PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are required');
  }
  return { clientId, secret };
}

async function getAccessToken() {
  const { clientId, secret } = getCredentials();
  const encoded = Buffer.from(`${clientId}:${secret}`).toString('base64');
  const res = await fetch(`${getBaseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${encoded}`,
    },
    body: 'grant_type=client_credentials',
  });

  const json = await res.json();
  if (!res.ok || !json.access_token) {
    throw new Error(json.error_description || json.error || 'PayPal auth failed');
  }
  return json.access_token;
}

/**
 * Create a PayPal order (intent CAPTURE)
 * @param {Object} opts
 * @param {number} opts.amount - Amount (e.g. 100.50)
 * @param {string} opts.currency - e.g. 'PHP', 'USD'
 * @param {string} opts.returnUrl - Where to redirect after approval
 * @param {string} opts.cancelUrl - Where to redirect on cancel
 * @param {string} [opts.customId] - Custom reference (e.g. subdomain:orderId)
 * @returns {Promise<{ approveUrl: string, orderId: string }>}
 */
async function createOrder({ amount, currency = 'PHP', returnUrl, cancelUrl, customId }) {
  const token = await getAccessToken();
  const value = Number(amount).toFixed(2);

  const body = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        amount: {
          currency_code: String(currency || 'PHP').toUpperCase(),
          value,
        },
        ...(customId ? { custom_id: customId } : {}),
      },
    ],
    application_context: {
      return_url: returnUrl,
      cancel_url: cancelUrl,
    },
  };

  const res = await fetch(`${getBaseUrl()}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'PayPal-Request-Id': `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (!res.ok) {
    const msg = json.details?.[0]?.description || json.message || JSON.stringify(json);
    throw new Error(msg);
  }

  const orderId = json.id;
  const approveLink = json.links?.find((l) => l.rel === 'approve');
  const approveUrl = approveLink?.href;

  if (!orderId || !approveUrl) {
    throw new Error('Invalid PayPal order response');
  }

  return { approveUrl, orderId };
}

/**
 * Capture a PayPal order (after user approves)
 * @param {string} paypalOrderId - PayPal order ID
 * @returns {Promise<{ status: string }>}
 */
async function captureOrder(paypalOrderId) {
  const token = await getAccessToken();

  const res = await fetch(`${getBaseUrl()}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'PayPal-Request-Id': `cap-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    },
    body: JSON.stringify({}),
  });

  const json = await res.json();
  if (!res.ok) {
    const msg = json.details?.[0]?.description || json.message || JSON.stringify(json);
    throw new Error(msg);
  }

  return { status: json.status };
}

module.exports = {
  createOrder,
  captureOrder,
};
