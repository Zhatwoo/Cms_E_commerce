# PayMongo Payment Gateway Integration Plan

> **Recommended payment gateway for PH market**  
> Free setup • No monthly fee • API-first • Multi-channel (GCash, Maya, Cards, Bank, QRPH)

---

## 1. Overview

### Why PayMongo?
- ✅ **Free setup** — No signup or monthly fees
- ✅ **Pay-per-transaction** — Only pay when you earn
- ✅ **REST API** — Full control for custom web apps
- ✅ **Payment Links** — Quick checkout without code
- ✅ **Checkout API** — Custom checkout flows
- ✅ **Philippine-focused** — GCash, Maya, Bank Transfer, QRPH, Cards

### Fee Summary (as of 2024)
| Method | Fee |
|--------|-----|
| GCash | ~2.23% |
| Maya | ~1.96% |
| Cards (Visa/MC) | ~3.125% + ₱13.39 |
| Bank Transfer | ~0.71% |

---

## 2. Integration Options

| Option | Use Case | Effort | Flexibility |
|--------|----------|--------|-------------|
| **Payment Links** | Quick MVP, simple checkout | Low | Low |
| **Checkout API** | Custom branded checkout | Medium | High |
| **REST API (Sources + Payments)** | Full control, custom UX | High | Full |

**Recommendation for CMS E-commerce:** Start with **Checkout API** for branded experience, with option to add **Payment Links** for quick invoices/recurring.

---

## 3. Implementation Phases

### Phase 1: Setup & Configuration (1–2 days)
- [ ] Create PayMongo account at [paymongo.com](https://paymongo.com)
- [ ] Get **Secret Key** and **Public Key** (test + live)
- [ ] Add env vars: `PAYMONGO_SECRET_KEY`, `PAYMONGO_PUBLIC_KEY`
- [ ] Create backend service: `paymentService.js` or `paymongo.service.ts`

### Phase 2: Backend API (2–3 days)
- [ ] **Create Payment Intent** endpoint — initiates checkout
- [ ] **Create Source** endpoint — links payment method (GCash, Maya, etc.)
- [ ] **Retrieve Payment** endpoint — check status
- [ ] **Webhook handler** — receive payment success/failed events
- [ ] DB: Add `payment_intent_id`, `payment_status` to orders table

### Phase 3: Frontend Checkout (2–3 days)
- [ ] Load PayMongo.js on checkout page
- [ ] Create payment form (card) or redirect flow (GCash/Maya)
- [ ] Handle 3D Secure / bank redirects
- [ ] Success/Cancel/Return URLs

### Phase 4: Order Flow Integration (1–2 days)
- [ ] Link order → payment intent
- [ ] Update order status on webhook (`paid`, `failed`)
- [ ] Send confirmation email on `paid`
- [ ] Stock/inventory update on `paid`

### Phase 5: Admin & Reporting (1 day)
- [ ] Show payment status in order details
- [ ] Retry / refund flow (if needed)
- [ ] Basic reconciliation (optional)

---

## 4. Technical Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Checkout   │────▶│   Backend   │────▶│  PayMongo   │
│  (React)    │     │   (Node)    │     │    API      │
└─────────────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │                   │            Webhooks
       │                   ▼                   ▼
       │            ┌─────────────┐     ┌─────────────┐
       └───────────▶│   Database  │◀────│  Order      │
                    │   (Orders)  │     │  Status     │
                    └─────────────┘     └─────────────┘
```

### Key Endpoints
1. `POST /api/orders/:id/create-payment-intent` — Create payment for order
2. `POST /api/webhooks/paymongo` — Receive PayMongo events
3. `GET /api/orders/:id/payment-status` — Check payment status

---

## 5. PayMongo API Usage (Reference)

### Create Payment Intent
```http
POST https://api.paymongo.com/v1/payment_intents
Authorization: Basic base64(secret_key:)
Content-Type: application/json

{
  "data": {
    "attributes": {
      "amount": 10000,
      "currency": "PHP",
      "payment_method_allowed": ["gcash", "maya", "card", "paymaya"],
      "description": "Order #123"
    }
  }
}
```

### Create Source (e.g. GCash)
```http
POST https://api.paymongo.com/v1/sources
Authorization: Basic base64(secret_key:)
Content-Type: application/json

{
  "data": {
    "attributes": {
      "amount": 10000,
      "currency": "PHP",
      "redirect": {
        "success": "https://yoursite.com/checkout/success",
        "failed": "https://yoursite.com/checkout/failed"
      },
      "type": "gcash"
    }
  }
}
```

### Webhook Events
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `source.chargeable`

---

## 6. Environment Variables

```env
# PayMongo (Test)
PAYMONGO_SECRET_KEY=sk_test_xxxx
PAYMONGO_PUBLIC_KEY=pk_test_xxxx

# PayMongo (Live)
# PAYMONGO_SECRET_KEY=sk_live_xxxx
# PAYMONGO_PUBLIC_KEY=pk_live_xxxx

# Webhook
PAYMONGO_WEBHOOK_SECRET=whsec_xxxx
```

---

## 7. Security Checklist
- [ ] Store secret key in env only, never in frontend
- [ ] Use HTTPS for webhook URL
- [ ] Verify webhook signature before processing
- [ ] Validate amounts server-side (never trust client)
- [ ] Log payment events for audit

---

## 8. Dependencies
- `axios` or `node-fetch` for API calls
- PayMongo.js (frontend) for card payments: `<script src="https://js.paymongo.com/v1"></script>`

---

## 9. Docs & Resources
- [PayMongo API Docs](https://developers.paymongo.com)
- [Checkout API Guide](https://developers.paymongo.com/docs/checkout)
- [Webhooks](https://developers.paymongo.com/docs/webhooks)

---

## 10. Timeline (Estimated)
| Phase | Days |
|-------|------|
| Setup & Config | 1–2 |
| Backend API | 2–3 |
| Frontend Checkout | 2–3 |
| Order Flow | 1–2 |
| Admin | 1 |
| **Total** | **~7–11 days** |
