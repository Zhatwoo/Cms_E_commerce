# PayPal Payment Gateway Integration Plan

> **Global payment gateway**  
> PayPal • Debit/Credit (via PayPal)

---

## Quick Setup

1. Add to `.env`:
   ```
   PAYPAL_CLIENT_ID=your_client_id
   PAYPAL_CLIENT_SECRET=your_client_secret
   PAYPAL_SANDBOX=true
   APP_BASE_URL=https://yoursite.com
   ```

2. Get credentials from [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/):
   - Sandbox for testing, Live for production
   - Set `PAYPAL_SANDBOX=false` for live

---

## 1. Overview

### Why PayPal?
- ✅ **Global** — Works worldwide
- ✅ **Trusted** — Familiar to buyers
- ✅ **Hosted checkout** — Redirect to PayPal (no PCI scope)
- ✅ **Supports PHP** — Philippine Peso

### Flow
```
User website → Checkout → Backend creates PayPal Order
    → Redirect to PayPal approve page
    → User pays with PayPal
    → Redirect back → Backend captures → Mark order as Paid
```

---

## 2. Implementation Summary

| Component | Status |
|-----------|--------|
| Backend | ✅ `paypalService.js` — createOrder, captureOrder |
| Create | ✅ `POST .../create-payment-intent` — returns redirectUrl (approve URL) |
| Capture | ✅ `POST .../capture-paypal` — captures when user returns |
| Frontend | ✅ createPaymentIntent → redirectUrl, result page calls capture |
| Checkout | ✅ Single "Pay with PayPal" option |

---

## 3. PayPal Orders API

### Create Order
```http
POST https://api-m.sandbox.paypal.com/v2/checkout/orders
Authorization: Bearer {token}
Content-Type: application/json

{
  "intent": "CAPTURE",
  "purchase_units": [{
    "amount": { "currency_code": "PHP", "value": "500.00" }
  }],
  "application_context": {
    "return_url": "https://yoursite.com/.../result?order_id=xxx&status=success",
    "cancel_url": "https://yoursite.com/.../result?order_id=xxx&status=failed"
  }
}
```

### Capture (after approval)
```http
POST https://api-m.sandbox.paypal.com/v2/checkout/orders/{id}/capture
```

---

## 4. Environment Variables

```env
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_client_secret
PAYPAL_SANDBOX=true
APP_BASE_URL=https://yoursite.com
```

---

## 5. Security Checklist
- [x] Store credentials in env only
- [ ] Use HTTPS in production
- [x] Validate amounts server-side
- [x] Capture only for matching paypal_order_id

---

## 6. Docs & Resources
- [PayPal Orders API](https://developer.paypal.com/docs/api/orders/v2/)
- [Get Access Token](https://developer.paypal.com/reference/get-an-access-token/)
