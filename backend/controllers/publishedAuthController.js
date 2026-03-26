const jwt = require('jsonwebtoken');
const PublishedSiteUser = require('../models/PublishedSiteUser');
const { SITE_COOKIE_NAME, resolvePublishedSite } = require('../middleware/publishedSiteAuth');

const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function generateToken(id, subdomain) {
  return jwt.sign(
    { id, subdomain, type: 'published_site_user' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
}

function setSiteAuthCookie(res, token) {
  res.cookie(SITE_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE_MS,
    path: '/',
  });
}

function clearSiteAuthCookie(res) {
  res.clearCookie(SITE_COOKIE_NAME, { path: '/', httpOnly: true });
}

function siteUserToResponse(user) {
  if (!user) return null;
  return {
    id: user.id,
    uid: user.uid || user.id,
    email: user.email,
    name: user.displayName || user.fullName || user.email || '',
    avatar: user.avatar || null,
    role: 'site_user',
    status: user.status || 'active',
    isActive: user.isActive !== false,
    createdAt: user.createdAt,
  };
}

exports.register = async (req, res) => {
  try {
    const site = await resolvePublishedSite(req);
    if (!site || !site.subdomain) {
      return res.status(404).json({ success: false, message: 'Published site not found' });
    }

    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const existing = await PublishedSiteUser.findByEmail(site.subdomain, email);
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists for this site' });
    }

    const user = await PublishedSiteUser.create(site.subdomain, { name, email, password });
    const token = generateToken(user.id, site.subdomain);
    setSiteAuthCookie(res, token);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: siteUserToResponse(user),
      subdomain: site.subdomain,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const site = await resolvePublishedSite(req);
    if (!site || !site.subdomain) {
      return res.status(404).json({ success: false, message: 'Published site not found' });
    }

    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await PublishedSiteUser.authenticate(site.subdomain, email, password);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user.id, site.subdomain);
    setSiteAuthCookie(res, token);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: siteUserToResponse(user),
      subdomain: site.subdomain,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

exports.getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: siteUserToResponse(req.publishedUser),
    subdomain: req.publishedSite?.subdomain || null,
  });
};

exports.logout = (req, res) => {
  clearSiteAuthCookie(res);
  res.status(200).json({ success: true, message: 'Logged out' });
};
