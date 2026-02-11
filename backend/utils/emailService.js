const nodemailer = require('nodemailer');
const { Resend } = require('resend');

const resendKey = (process.env.RESEND_API_KEY || '').trim();
const gmailUser = (process.env.GMAIL_USER || '').trim();
const gmailAppPassword = (process.env.GMAIL_APP_PASSWORD || '').trim();
const fromEmailResend = process.env.RESEND_FROM || 'Mercato <onboarding@resend.dev>';
const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');

let resendClient = null;
if (resendKey) resendClient = new Resend(resendKey);

let gmailTransporter = null;
if (gmailUser && gmailAppPassword) {
  gmailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });
  console.log('[emailService] ✅ Gmail SMTP ready. Emails will be sent FROM:', gmailUser);
} else {
  if (resendClient) {
    console.log('[emailService] Using Resend (no Gmail). Add GMAIL_USER + GMAIL_APP_PASSWORD in .env for reliable Gmail delivery.');
  } else {
    console.warn('[emailService] ❌ No email config. Add to backend/.env: GMAIL_USER + GMAIL_APP_PASSWORD (see EMAIL_SETUP.md)');
  }
}

/**
 * Build confirmation URL.
 */
function getConfirmUrl(token) {
  return `${frontendUrl}/auth/confirm?token=${encodeURIComponent(token)}`;
}

/**
 * Send verification email via Gmail SMTP (recommended for Gmail inbox delivery).
 */
async function sendViaGmail(to, subject, html, confirmUrl) {
  const fromLabel = process.env.GMAIL_FROM_NAME || 'Mercato';
  try {
    const info = await gmailTransporter.sendMail({
      from: `"${fromLabel}" <${gmailUser}>`,
      to,
      subject,
      html,
    });
    console.log('[emailService] ✅ Gmail sent to', to, '| MessageId:', info.messageId || '');
    return { sent: true, confirmUrl };
  } catch (err) {
    console.error('[emailService] Gmail error:', err.message);
    return { sent: false, error: err.message, confirmUrl };
  }
}

/**
 * Send verification email to the USER'S EMAIL (the one they typed when registering).
 * Recipient is always the user's email from the form — never from Firebase.
 * User is NOT in Firebase/DB yet; they get created only when they click the link in the email.
 */
async function sendVerificationEmail(to, token, name) {
  const confirmUrl = getConfirmUrl(token);
  const loginUrl = `${frontendUrl}/auth/login`;
  const greeting = name ? `Hi ${name},` : 'Hi,';

  console.log('[emailService] 📤 Sending confirmation to user email:', to);
  if (gmailTransporter) {
    console.log('[emailService]    (via Gmail SMTP)');
  } else if (resendClient) {
    console.log('[emailService]    (via Resend)');
  } else {
    console.log('[emailService] ⚠️ No sender configured. Email NOT sent.');
  }

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

  if (gmailTransporter) {
    const result = await sendViaGmail(to, subject, html, confirmUrl);
    if (result.sent) return result;
    console.log('[emailService] 📧 Backup link:', confirmUrl);
    return result;
  }

  if (resendClient) {
    try {
      console.log('[emailService] Attempting Resend send to:', to);
      console.log('[emailService] From:', fromEmailResend);
      const { data, error } = await resendClient.emails.send({
        from: fromEmailResend,
        to: [to],
        subject,
        html,
      });
      if (error) {
        console.error('[emailService] ❌ Resend API error:', JSON.stringify(error, null, 2));
        console.error('[emailService] Error message:', error?.message);
        console.error('[emailService] Error code:', error?.name || error?.code);
        console.log('[emailService] 📧 Confirmation link (backup):', confirmUrl);
        return { sent: false, error: error?.message || JSON.stringify(error), confirmUrl };
      }
      console.log('[emailService] ✅ Resend accepted. Email ID:', data?.id || '(none)');
      console.log('[emailService] ✅ Sent to:', to);
      console.log('[emailService] 📧 If email does not arrive: 1) Check Spam 2) Resend with onboarding@resend.dev may only deliver to the email you used to sign up for Resend');
      return { sent: true, confirmUrl, resendId: data?.id };
    } catch (err) {
      console.error('[emailService] ❌ Resend exception:', err.message);
      console.error('[emailService] Exception details:', err);
      console.log('[emailService] 📧 Confirmation link (backup):', confirmUrl);
      return { sent: false, error: err.message || 'Failed to send', confirmUrl };
    }
  }

  console.log('[emailService] 📧 No email config. Use this link to confirm:', confirmUrl);
  return { sent: false, error: 'Email not configured', confirmUrl };
}

module.exports = { sendVerificationEmail, getConfirmUrl };
