const nodemailer = require('nodemailer');

const gmailUser = (process.env.GMAIL_USER || '').trim();
const gmailAppPassword = (process.env.GMAIL_APP_PASSWORD || '').trim();
const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');

let transporter = null;
if (gmailUser && gmailAppPassword) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
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

function getResetPasswordUrl(token) {
  return `${frontendUrl}/auth/reset-password?token=${encodeURIComponent(token)}`;
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
    <div style="background:#070525;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;background:#09022f;border:1px solid rgba(79,54,184,0.55);border-radius:20px;overflow:hidden;box-shadow:0 24px 80px rgba(8,3,36,0.75);">
        <div style="padding:28px 28px 24px;background:radial-gradient(circle at 15% 0%, rgba(168,85,247,0.22), transparent 40%), radial-gradient(circle at 85% 15%, rgba(255,204,0,0.08), transparent 35%);">
          <p style="margin:0 0 14px;color:#c7b8ff;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;">Finding Neo</p>
          <h1 style="margin:0;color:#ffffff;font-size:30px;line-height:1.2;font-weight:700;">Confirm your email</h1>
        </div>
        <div style="padding:0 28px 28px;">
          <p style="font-size:16px;color:#e9e7ff;line-height:1.6;margin:0 0 18px;">${greeting}</p>
          <p style="font-size:15px;color:rgba(233,231,255,0.8);line-height:1.7;margin:0 0 26px;">
            Welcome to Finding Neo. Please confirm your email address to activate your account.
          </p>
          <p style="margin:0 0 28px;text-align:center;">
            <a href="${confirmUrl}" style="display:inline-block;background:linear-gradient(90deg,#6d1eea,#7b19dc);color:#ffffff;padding:14px 26px;text-decoration:none;border-radius:12px;font-weight:700;font-size:15px;">Confirm email</a>
          </p>
          <p style="color:rgba(233,231,255,0.7);font-size:13px;line-height:1.6;margin:0 0 10px;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="color:#cba6ff;font-size:12px;word-break:break-all;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);padding:10px 12px;border-radius:8px;margin:0 0 18px;">${confirmUrl}</p>
          <p style="color:rgba(233,231,255,0.6);font-size:12px;line-height:1.6;margin:0;">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
          <p style="color:rgba(233,231,255,0.7);font-size:12px;line-height:1.6;margin:16px 0 0;">The Finding Neo Team</p>
        </div>
      </div>
    </div>
  `;

  const subject = 'Welcome to Finding Neo! Confirm your email';
  const fromLabel = process.env.GMAIL_FROM_NAME || 'Finding Neo';

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

async function sendPasswordResetEmail(to, token, name) {
  const recipient = typeof to === 'string' ? to.trim().toLowerCase() : '';
  if (!recipient) {
    console.warn('[emailService] ⚠️ No recipient email provided for password reset.');
    return { sent: false, error: 'No recipient email', resetUrl: getResetPasswordUrl(token) };
  }

  const resetUrl = getResetPasswordUrl(token);
  const greeting = name ? `Hi ${String(name).trim()},` : 'Hi,';

  const html = `
    <div style="background:#070525;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;background:#09022f;border:1px solid rgba(79,54,184,0.55);border-radius:20px;overflow:hidden;box-shadow:0 24px 80px rgba(8,3,36,0.75);">
        <div style="padding:28px 28px 24px;background:radial-gradient(circle at 15% 0%, rgba(168,85,247,0.22), transparent 40%), radial-gradient(circle at 85% 15%, rgba(255,204,0,0.08), transparent 35%);">
          <p style="margin:0 0 14px;color:#c7b8ff;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;">Finding Neo</p>
          <h1 style="margin:0;color:#ffffff;font-size:30px;line-height:1.2;font-weight:700;">Reset your password</h1>
        </div>
        <div style="padding:0 28px 28px;">
          <p style="font-size:16px;color:#e9e7ff;line-height:1.6;margin:0 0 18px;">${greeting}</p>
          <p style="font-size:15px;color:rgba(233,231,255,0.8);line-height:1.7;margin:0 0 26px;">
            We received a request to reset your password. Click the button below to set a new one.
          </p>
          <p style="margin:0 0 28px;text-align:center;">
            <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(90deg,#6d1eea,#7b19dc);color:#ffffff;padding:14px 26px;text-decoration:none;border-radius:12px;font-weight:700;font-size:15px;">Reset password</a>
          </p>
          <p style="color:rgba(233,231,255,0.7);font-size:13px;line-height:1.6;margin:0 0 10px;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="color:#cba6ff;font-size:12px;word-break:break-all;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);padding:10px 12px;border-radius:8px;margin:0 0 18px;">${resetUrl}</p>
          <p style="color:rgba(233,231,255,0.6);font-size:12px;line-height:1.6;margin:0;">This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
          <p style="color:rgba(233,231,255,0.7);font-size:12px;line-height:1.6;margin:16px 0 0;">The Finding Neo Team</p>
        </div>
      </div>
    </div>
  `;

  const subject = 'Finding Neo password reset request';
  const fromLabel = process.env.GMAIL_FROM_NAME || 'Finding Neo';

  if (!transporter) {
    console.log('[emailService] 📧 No SMTP config. Password reset link (dev):', resetUrl);
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
