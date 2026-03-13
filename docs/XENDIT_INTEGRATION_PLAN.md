# Xendit Payment Gateway Integration Plan

> **DEPRECATED** — Switched to PayPal. See [PAYPAL_INTEGRATION_PLAN.md](./PAYPAL_INTEGRATION_PLAN.md)

> **Philippine payment gateway** (legacy)  
> GCash • Maya • Cards • Single Invoice flow

---

## Quick Setup

1. Add to `.env`:
   ```
   XENDIT_SECRET_KEY=xnd_development_xxxx
   XENDIT_WEBHOOK_VERIFICATION_TOKEN=your_webhook_token
   APP_BASE_URL=https://yoursite.com
   ```

2. In [Xendit Dashboard](https://dashboard.xendit.co/) → Settings → Webhooks:
   - Webhook URL: `https://yoursite.com/api/webhooks/xendit`
   - Copy Callback Verification Token → `XENDIT_WEBHOOK_VERIFICATION_TOKEN`

---

## 1. Overview

### Why Xendit?
- ✅ **Philippine-focused** — GCash, Maya, Cards, Virtual Accounts
- ✅ **Single Invoice API** — One integration for all payment methods
- ✅ **Hosted checkout** — Redirect to Xendit payment page (no PCI scope)
- ✅ **Webhooks** — Reliable payment status updates

### Flow
```
User website → Checkout → Backend creates Xendit Invoice
    → Redirect to Xendit payment page (GCash / Maya / Card)
    → User pays
    → Webhook (invoice.paid) → Mark order as Paid
```

---

## 2. Implementation Summary

| Component | Status |
|-----------|--------|
| Backend | ✅ `xenditService.js` — createInvoice, verifyWebhookToken |
| Webhook | ✅ `POST /api/webhooks/xendit` — handle invoice.paid |
| Order | ✅ Create invoice → store `xendit_invoice_id` → redirect to `invoice_url` |
| Frontend | ✅ createPaymentIntent → always returns `redirectUrl` |

---

## 3. Xendit Invoice API

### Create Invoice
```http
POST https://api.xendit.co/v2/invoices
Authorization: Basic base64(secret_key:)
Content-Type: application/json

{
  "external_id": "subdomain:orderId",
  "amount": 500,
  "currency": "PHP",
  "description": "Order #orderId",
  "invoice_duration": 172800,
  "success_redirect_url": "https://yoursite.com/sites/{subdomain}/checkout/result?order_id={id}&status=success",
  "failure_redirect_url": "https
- **PHP**: Amount in pesos (whole number). Example: 500 = ₱500
- **PayMongo (legacy)**: Amount in centavos (50000 = ₱500)

### Response
```json
{
  "id": "invoice_id_xxx",
  "invoice_url": "https://checkout.xendit.co/web/xxx",
  "external_id": "subdomain:orderId",
  "status": "PENDING",
  ...
}
```

---

## 4. Webhook

### Events
- `invoice.paid` — Payment completed

### Verification
- Header: `x-callback-token` — Must match `XENDIT_WEBHOOK_VERIFICATION_TOKEN`

### Payload (snake_case)
```json
{
  "id": "invoice_id",
  "external_id": "subdomain:orderId",
  "status": "PAID",
  ...
}
```

Parse `external_id` to get `subdomain` and `orderId`, then mark order as Paid.

---

## 5. Environment Variables

```env
# Xendit
XENDIT_SECRET_KEY=xnd_development_xxxx
XENDIT_WEBHOOK_VERIFICATION_TOKEN=your_webhook_token

# Remove PayMongo (after migration)
# PAYMONGO_SECRET_KEY=
# PAYMONGO_PUBLIC_KEY=
# PAYMONGO_WEBHOOK_SECRET=
```

---

## 6. Security Checklist
- [x] Store secret key in env only
- [ ] Use HTTPS for webhook URL (production)
- [x] Verify x-callback-token before processing
- [x] Validate amounts server-side (from order.total)
- [ ] Log payment events for audit

---

## 7. Docs & Resources
- [Xendit API Reference](https://developers.xendit.co/api-reference/)
- [Invoice API](https://developers.xendit.co/api-reference/#tag/Invoice)
- [Webhooks](https://docs.xendit.co/webhook/)
