const nodemailer = require('nodemailer');
const log = require('./logger')('emailService');

const gmailUser = (process.env.GMAIL_USER || '').trim();
const gmailAppPassword = (process.env.GMAIL_APP_PASSWORD || '').trim();
const { getFirstUrl } = require('./urlBase');
const frontendUrl = getFirstUrl(process.env.FRONTEND_URL, 'http://localhost:3000');

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
  log.info('[emailService] ✅ Nodemailer (Gmail SMTP) ready. Emails FROM:', gmailUser);
} else {
  log.warn('[emailService] ❌ No email config. Add to backend/.env: GMAIL_USER + GMAIL_APP_PASSWORD');
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
    log.warn('[emailService] ⚠️ No recipient email provided.');
    return { sent: false, error: 'No recipient email', confirmUrl: getConfirmUrl(token) };
  }

  const confirmUrl = getConfirmUrl(token);
  const greeting = name ? `Hi ${String(name).trim()},` : 'Hi,';

  log.info('[emailService] 📤 Sending confirmation to:', recipient);

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
    log.info('[emailService] 📧 No SMTP config. Confirmation link (dev):', confirmUrl);
    return { sent: false, error: 'Email not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in .env', confirmUrl };
  }

  try {
    const info = await transporter.sendMail({
      from: `"${fromLabel}" <${gmailUser}>`,
      to: recipient,
      subject,
      html,
    });
    log.info('[emailService] ✅ Sent to', recipient, '| MessageId:', info.messageId || '');
    return { sent: true, confirmUrl };
  } catch (err) {
    log.error('[emailService] ❌ Send error:', err.message);
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
    log.warn('[emailService] ⚠️ No recipient email for password reset.');
    return { sent: false, error: 'No recipient email', resetUrl: token ? getResetPasswordUrl(token) : null };
  }

  const resetUrl = getResetPasswordUrl(token);
  const greeting = name ? `Hi ${String(name).trim()},` : 'Hi,';

  log.info('[emailService] 📤 Sending password reset to:', recipient);

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
    log.info('[emailService] 📧 No SMTP config. Reset link (dev):', resetUrl);
    return { sent: false, error: 'Email not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in .env', resetUrl };
  }

  try {
    const info = await transporter.sendMail({
      from: `"${fromLabel}" <${gmailUser}>`,
      to: recipient,
      subject,
      html,
    });
    log.info('[emailService] ✅ Password reset email sent to', recipient, '| MessageId:', info.messageId || '');
    return { sent: true, resetUrl };
  } catch (err) {
    log.error('[emailService] ❌ Password reset send error:', err.message);
    return { sent: false, error: err.message, resetUrl };
  }
}

/**
 * Send collaboration invitation email.
 */
async function sendCollaborationInviteEmail({ to, fromName, projectId, projectTitle, permission }) {
  const recipient = typeof to === 'string' ? to.trim().toLowerCase() : '';
  if (!recipient) {
    log.warn('[emailService] ⚠️ No recipient email for collaboration invite.');
    return { sent: false, error: 'No recipient email' };
  }

  log.info('[emailService] 📤 Sending collaboration invite to:', recipient);

  const appUrl = frontendUrl;
  const inviteUrl = `${appUrl}/design?projectId=${projectId}`;
  const subject = `${fromName} invited you to collaborate`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
      <h1 style="color: #0a0d14; font-size: 24px; font-weight: 600; margin-bottom: 24px; line-height: 1.2;">Collaboration Invitation</h1>
      <p style="font-size: 16px; color: #333; line-height: 1.6; margin-bottom: 24px;">
        <strong>${fromName}</strong> has invited you to collaborate on the project <strong>${projectTitle || 'Untitled Project'}</strong>.
      </p>
      <p style="font-size: 16px; color: #555; line-height: 1.7; margin-bottom: 32px;">
        You have been granted <strong>${permission}</strong> access. Click the button below to open the project and start collaborating.
      </p>
      <p style="margin: 40px 0; text-align: center;">
        <a href="${inviteUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(124, 58, 237, 0.2);">Open Project</a>
      </p>
      <p style="color: #666; font-size: 14px; margin-top: 32px; padding-top: 24px; border-top: 1px solid #eee;">
        If you don't have an account yet, please sign up using this email address to access the project.
      </p>
      <p style="color: #999; font-size: 13px; margin-top: 40px; padding-top: 24px; border-top: 1px solid #eee;">
        Cheers,<br>
        The Mercato Team
      </p>
    </div>
  `;

  const fromLabel = process.env.GMAIL_FROM_NAME || 'Mercato';

  if (!transporter) {
    log.info('[emailService] 📧 No SMTP config. Invite link (dev):', inviteUrl);
    return { sent: false, error: 'Email not configured.', inviteUrl };
  }

  try {
    const info = await transporter.sendMail({
      from: `"${fromLabel}" <${gmailUser}>`,
      to: recipient,
      subject,
      html,
    });
    log.info('[emailService] ✅ Collaboration invite sent to', recipient, '| MessageId:', info.messageId || '');
    return { sent: true };
  } catch (err) {
    log.error('[emailService] ❌ Invite send error:', err.message);
    return { sent: false, error: err.message };
  }
}

async function sendAdminActionEmail({ to, name, subject, title, intro, reason }) {
  const recipient = typeof to === 'string' ? to.trim().toLowerCase() : '';
  if (!recipient) {
    return { sent: false, error: 'No recipient email' };
  }

  const fromLabel = process.env.GMAIL_FROM_NAME || 'Mercato';
  const greeting = name ? `Hi ${String(name).trim()},` : 'Hi,';
  const safeSubject = String(subject || 'Account update from admin').trim();
  const safeTitle = String(title || 'Update from admin').trim();
  const safeIntro = String(intro || 'An administrator made a change to your account resources.').trim();
  const safeReason = String(reason || '').trim();

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 36px 20px;">
      <h1 style="color: #0a0d14; font-size: 24px; font-weight: 600; margin-bottom: 18px; line-height: 1.25;">${safeTitle}</h1>
      <p style="font-size: 15px; color: #333; line-height: 1.6; margin-bottom: 16px;">${greeting}</p>
      <p style="font-size: 15px; color: #555; line-height: 1.7; margin-bottom: 18px;">${safeIntro}</p>
      ${safeReason ? `<div style="margin: 18px 0; padding: 12px; border-radius: 8px; background: #f5f5f5; border: 1px solid #e7e7e7;"><p style="margin: 0; font-size: 13px; color: #4a4a4a;"><strong>Reason:</strong> ${safeReason}</p></div>` : ''}
      <p style="color: #777; font-size: 13px; margin-top: 24px;">If you need help, please contact support.</p>
      <p style="color: #999; font-size: 13px; margin-top: 18px;">Mercato Team</p>
    </div>
  `;

  if (!transporter) {
    log.info('[emailService] 📧 No SMTP config. Admin action email skipped for:', recipient);
    return { sent: false, error: 'Email not configured' };
  }

  try {
    const info = await transporter.sendMail({
      from: `"${fromLabel}" <${gmailUser}>`,
      to: recipient,
      subject: safeSubject,
      html,
    });
    return { sent: true, messageId: info.messageId || '' };
  } catch (err) {
    log.error('[emailService] ❌ Admin action send error:', err.message);
    return { sent: false, error: err.message };
  }
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendCollaborationInviteEmail,
  sendAdminActionEmail,
  getConfirmUrl,
  getResetPasswordUrl
};
