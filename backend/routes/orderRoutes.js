// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const {
  create,
  getMyOrders,
  getOne,
  getAll,
  updateStatus,
  createPublicCheckout,
  createPaymentIntent,
  capturePayPal,
  getPaymongoPublicKey,
  getMyPublishedOrders,
  updatePublishedOrderStatus,
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/auth');

router.get('/paymongo-public-key', getPaymongoPublicKey);
router.post('/published/:subdomain', createPublicCheckout);
router.post('/published/:subdomain/:id/create-payment-intent', createPaymentIntent);
router.get('/published/:subdomain/:id/capture-paypal', capturePayPal);
router.get('/published/my', protect, getMyPublishedOrders);
router.put('/published/:subdomain/:id/status', protect, updatePublishedOrderStatus);

router.post('/', protect, create);
router.get('/my', protect, getMyOrders);
router.get('/', protect, admin, getAll);
router.get('/:id', protect, getOne);
router.put('/:id/status', protect, updateStatus);

module.exports = router;
