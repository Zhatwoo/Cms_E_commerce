/**
 * Xendit API integration
 * Docs: https://developers.xendit.co/api-reference/
 *
 * Amounts for PHP are in pesos (whole number). Example: 500 PHP = 500
 */

const XENDIT_API = 'https://api.xendit.co/v2';

function getSecretKey() {
  const key = process.env.XENDIT_SECRET_KEY;
  if (!key || !key.startsWith('xnd_')) {
    throw new Error('XENDIT_SECRET_KEY is required and must start with xnd_');
  }
  return key;
}

function getAuthHeader() {
  const key = getSecretKey();
  const encoded = Buffer.from(key + ':').toString('base64');
  return 'Basic ' + encoded;
}

/**
 * Create an Invoice (GCash, Maya, Cards via hosted page)
 * @param {Object} opts
 * @param {number} opts.amount - Amount in pesos (PHP)
 * @param {string} opts.currency - e.g. 'PHP'
 * @param {string} opts.externalId - e.g. 'subdomain:orderId'
 * @param {string} opts.description
 * @param {string} opts.successRedirectUrl
 * @param {string} opts.failureRedirectUrl
 * @param {Object} [opts.metadata]
 * @returns {Promise<{ invoiceUrl: string, id: string }>}
 */
async function createInvoice({
  amount,
  currency = 'PHP',
  externalId,
  description,
  successRedirectUrl,
  failureRedirectUrl,
  metadata = {},
}) {
  const body = {
    external_id: String(externalId),
    amount: Math.max(1, Math.round(amount)),
    currency: String(currency || 'PHP').toUpperCase(),
    description: description || `Order ${externalId}`,
    invoice_duration: 172800, // 48 hours
    success_redirect_url: successRedirectUrl,
    failure_redirect_url: failureRedirectUrl,
    metadata: Object.fromEntries(
      Object.entries(metadata).map(([k, v]) => [k, String(v)])
    ),
  };

  const res = await fetch(`${XENDIT_API}/invoices`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: getAuthHeader(),
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (!res.ok) {
    const err = json?.message || json?.error_code || JSON.stringify(json);
    throw new Error(typeof err === 'string' ? err : err);
  }

  const invoiceUrl = json.invoice_url;
  const id = json.id;
  if (!id || !invoiceUrl) {
    throw new Error('Invalid Xendit invoice response');
  }

  return { invoiceUrl, id };
}

/**
 * Verify Xendit webhook token (x-callback-token header)
 * @param {string} token - Value from x-callback-token header
 * @returns {boolean}
 */
function verifyWebhookToken(token) {
  const expected = process.env.XENDIT_WEBHOOK_VERIFICATION_TOKEN;
  if (!expected || !token) return false;
  return token === expected;
}

module.exports = {
  createInvoice,
  verifyWebhookToken,
};
