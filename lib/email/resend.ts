import { Resend } from 'resend';

let resendInstance: Resend | null = null;

export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[Email Warning] RESEND CONFIGURATION MISSING: process.env.RESEND_API_KEY is not set.');
    return null;
  }
  if (!resendInstance) {
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

interface SendPasswordResetEmailParams {
  to: string;
  name: string;
  resetUrl: string;
}

export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
}: SendPasswordResetEmailParams): Promise<{ success: boolean; error?: string }> {
  const resend = getResendClient();
  if (!resend) {
    return {
      success: false,
      error: 'RESEND CONFIGURATION MISSING',
    };
  }

  try {
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'PROTON CMS <onboarding@resend.dev>';
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to,
      subject: 'PROTON CMS — Member Password Reset Request',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: monospace, sans-serif; background-color: #050505; color: #ffffff; padding: 24px; margin: 0; }
              .container { max-width: 540px; margin: 0 auto; background: #0c0c0c; border: 1px solid #222222; border-radius: 12px; padding: 32px; }
              .badge { display: inline-block; background: #00d05a; color: #000000; font-weight: bold; font-size: 11px; padding: 4px 8px; border-radius: 4px; margin-bottom: 20px; }
              h1 { font-size: 18px; color: #ffffff; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 1px; }
              p { font-size: 13px; line-height: 1.6; color: #a1a1aa; margin: 0 0 20px 0; }
              .btn { display: inline-block; background: #00d05a; color: #000000; text-decoration: none; font-weight: bold; font-size: 13px; padding: 12px 24px; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
              .footer { margin-top: 32px; border-top: 1px solid #1a1a1a; padding-top: 16px; font-size: 11px; color: #52525b; }
              .code-block { background: #141414; border: 1px solid #222222; padding: 12px; border-radius: 6px; font-size: 11px; word-break: break-all; color: #71717a; margin-top: 16px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="badge">PROTON CMS // SECURITY PROTOCOL</div>
              <h1>Password Reset Request</h1>
              <p>Hello ${name || 'Member'},</p>
              <p>A password reset was requested for your PROTON member account (${to}). Click the button below to set a new password. This link is single-use and will expire in 1 hour.</p>
              <div style="margin: 28px 0;">
                <a href="${resetUrl}" class="btn" target="_blank">Reset Member Password &rarr;</a>
              </div>
              <p>If you did not request this password reset, please ignore this email. Your current password remains secure.</p>
              <div class="footer">
                PROTON<br>
                NMAM Institute of Technology, Nitte
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('[Email Error] Failed to send reset email via Resend:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[Email Error] Exception while sending email:', err.message || err);
    return { success: false, error: err.message || 'Unknown email error' };
  }
}
