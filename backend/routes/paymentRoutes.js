const express = require('express');
const router = express.Router();
const unionbankService = require('../services/unionbankService');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// GET /api/payments/unionbank/link - Redirect to UnionBank login
router.get('/unionbank/link', protect, (req, res) => {
  const authUrl = unionbankService.getAuthUrl(req.user.id);
  res.json({ success: true, url: authUrl });
});

// GET /api/payments/unionbank/callback - UnionBank callback handler
router.get('/unionbank/callback', async (req, res) => {
  try {
    const { code, state: userId } = req.query;
    if (!code) return res.status(400).send('Grant code missing');

    const tokenData = await unionbankService.handleCallback(code);
    
    // In a real app, you would fetch account details using the token.
    // Here we'll just simulate adding it to the user profile.
    const user = await User.findById(userId);
    if (!user) return res.status(404).send('User not found');

    const newMethod = {
      id: `ubp_${Date.now()}`,
      type: 'unionbank',
      last4: 'UBP', // UnionBank account
      accountName: 'UnionBank Account',
      linkedAt: new Date()
    };

    const updatedMethods = [...(user.paymentMethods || []), newMethod];
    await User.update(userId, { paymentMethods: updatedMethods });

    // Redirect back to frontend settings
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/m_dashboard/settings?tab=billing&success=true`);
  } catch (error) {
    console.error('UnionBank Callback Error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/m_dashboard/settings?tab=billing&error=unionbank_failed`);
  }
});

module.exports = router;
