const nodemailer = require('nodemailer');

const gmailUser = (process.env.GMAIL_USER || '').trim();
const gmailAppPassword = (process.env.GMAIL_APP_PASSWORD || '').trim();
const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');

let transporter = null;
if (gmailUser && gmailAppPassword) {
  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
    tls: { rejectUnauthorized: true },
  });
  console.log('[emailService] ✅ Nodemailer (Gmail SMTP) ready. Emails FROM:', gmailUser);
} else {
  console.warn('[emailService] ❌ No email config. Add to backend/.env: GMAIL_USER + GMAIL_APP_PASSWORD');
}

/**
 * Build confirmation URL.
 */
function getConfirmUrl(token) {
  return `${frontendUrl}/auth/confirm?token=${encodeURIComponent(token)}`;
}

/**
 * Send verification email via Nodemailer (Gmail SMTP). Dynamic — sends to any recipient.
 */
async function sendVerificationEmail(to, token, name) {
  const recipient = typeof to === 'string' ? to.trim().toLowerCase() : '';
  if (!recipient) {
    console.warn('[emailService] ⚠️ No recipient email provided.');
    return { sent: false, error: 'No recipient email', confirmUrl: getConfirmUrl(token) };
  }

  const confirmUrl = getConfirmUrl(token);
  const greeting = name ? `Hi ${String(name).trim()},` : 'Hi,';

  console.log('[emailService] 📤 Sending confirmation to:', recipient);

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
      <h1 style="color: #0a0d14; font-size: 28px; font-weight: 600; margin-bottom: 24px; line-height: 1.2;">Welcome to Mercato!</h1>
      <p style="font-size: 16px; color: #333; line-height: 1.6; margin-bottom: 24px;">${greeting}</p>
      <p style="font-size: 16px; color: #555; line-height: 1.7; margin-bottom: 32px;">
        Thank you for signing up! We're excited to have you on board. To get started, please confirm your email address by clicking the button below.
      </p>
      <p style="margin: 40px 0; text-align: center;">
        <a href="${confirmUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(124, 58, 237, 0.2);">Confirm your email</a>
      </p>
      <p style="color: #666; font-size: 14px; margin-top: 32px; padding-top: 24px; border-top: 1px solid #eee;">
        If the button doesn't work, copy and paste this link into your browser:
      </p>
      <p style="color: #7c3aed; font-size: 13px; word-break: break-all; background: #f5f5f5; padding: 12px; border-radius: 4px; margin: 12px 0;">${confirmUrl}</p>
      <p style="color: #999; font-size: 13px; margin-top: 40px; padding-top: 24px; border-top: 1px solid #eee;">
        This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
      </p>
      <p style="color: #999; font-size: 13px; margin-top: 24px;">
        Cheers,<br>
        The Mercato Team
      </p>
    </div>
  `;

  const subject = 'Welcome to Mercato!';
  const fromLabel = process.env.GMAIL_FROM_NAME || 'Mercato';

  if (!transporter) {
    console.log('[emailService] 📧 No SMTP config. Confirmation link (dev):', confirmUrl);
    return { sent: false, error: 'Email not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in .env', confirmUrl };
  }

  try {
    const info = await transporter.sendMail({
      from: `"${fromLabel}" <${gmailUser}>`,
      to: recipient,
      subject,
      html,
    });
    console.log('[emailService] ✅ Sent to', recipient, '| MessageId:', info.messageId || '');
    return { sent: true, confirmUrl };
  } catch (err) {
    console.error('[emailService] ❌ Send error:', err.message);
    return { sent: false, error: err.message, confirmUrl };
  }
}

/**
 * Build password reset URL.
 */
function getResetPasswordUrl(token) {
  return `${frontendUrl}/auth/reset-password?token=${encodeURIComponent(token)}`;
}

/**
 * Send password reset email via Nodemailer (Gmail SMTP).
 */
async function sendPasswordResetEmail(to, token, name) {
  const recipient = typeof to === 'string' ? to.trim().toLowerCase() : '';
  if (!recipient) {
    console.warn('[emailService] ⚠️ No recipient email for password reset.');
    return { sent: false, error: 'No recipient email', resetUrl: token ? getResetPasswordUrl(token) : null };
  }

  const resetUrl = getResetPasswordUrl(token);
  const greeting = name ? `Hi ${String(name).trim()},` : 'Hi,';

  console.log('[emailService] 📤 Sending password reset to:', recipient);

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
      <h1 style="color: #0a0d14; font-size: 28px; font-weight: 600; margin-bottom: 24px; line-height: 1.2;">Reset your password</h1>
      <p style="font-size: 16px; color: #333; line-height: 1.6; margin-bottom: 24px;">${greeting}</p>
      <p style="font-size: 16px; color: #555; line-height: 1.7; margin-bottom: 32px;">
        You requested a password reset for your Mercato account. Click the button below to set a new password.
      </p>
      <p style="margin: 40px 0; text-align: center;">
        <a href="${resetUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(124, 58, 237, 0.2);">Reset password</a>
      </p>
      <p style="color: #666; font-size: 14px; margin-top: 32px; padding-top: 24px; border-top: 1px solid #eee;">
        If the button doesn't work, copy and paste this link into your browser:
      </p>
      <p style="color: #7c3aed; font-size: 13px; word-break: break-all; background: #f5f5f5; padding: 12px; border-radius: 4px; margin: 12px 0;">${resetUrl}</p>
      <p style="color: #999; font-size: 13px; margin-top: 40px; padding-top: 24px; border-top: 1px solid #eee;">
        This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.
      </p>
      <p style="color: #999; font-size: 13px; margin-top: 24px;">
        Cheers,<br>
        The Mercato Team
      </p>
    </div>
  `;

  const subject = 'Reset your Mercato password';
  const fromLabel = process.env.GMAIL_FROM_NAME || 'Mercato';

  if (!transporter) {
    console.log('[emailService] 📧 No SMTP config. Reset link (dev):', resetUrl);
    return { sent: false, error: 'Email not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in .env', resetUrl };
  }

  try {
    const info = await transporter.sendMail({
      from: `"${fromLabel}" <${gmailUser}>`,
      to: recipient,
      subject,
      html,
    });
    console.log('[emailService] ✅ Password reset email sent to', recipient, '| MessageId:', info.messageId || '');
    return { sent: true, resetUrl };
  } catch (err) {
    console.error('[emailService] ❌ Password reset send error:', err.message);
    return { sent: false, error: err.message, resetUrl };
  }
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail, getConfirmUrl, getResetPasswordUrl };
