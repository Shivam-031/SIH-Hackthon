import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD, // 16-char Google App Password
    },
  });

  return transporter;
};

/**
 * Sends an OTP verification email.
 * @param {string} to - recipient email
 * @param {string} otp - 6-digit code
 * @param {string} name - recipient's name
 */
export const sendOTPEmail = async (to, otp, name = 'there') => {
  const t = getTransporter();

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
        <tr>
          <td align="center">
            <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.06);">
              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#2563eb,#7c3aed);padding:32px 40px;text-align:center;">
                  <div style="display:inline-flex;align-items:center;gap:10px;">
                    <span style="font-size:28px;">📍</span>
                    <span style="color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">CivicConnect</span>
                  </div>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:40px;">
                  <h2 style="margin:0 0 8px;font-size:20px;color:#111;">Hi ${name} 👋</h2>
                  <p style="margin:0 0 28px;color:#555;font-size:15px;line-height:1.6;">
                    Use the code below to verify your email address. It expires in <strong>10 minutes</strong>.
                  </p>

                  <!-- OTP box -->
                  <div style="background:#f0f4ff;border:2px dashed #c7d2fe;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
                    <p style="margin:0 0 6px;font-size:12px;color:#6366f1;font-weight:600;letter-spacing:2px;text-transform:uppercase;">Verification Code</p>
                    <p style="margin:0;font-size:42px;font-weight:800;letter-spacing:12px;color:#1e1b4b;font-variant-numeric:tabular-nums;">${otp}</p>
                  </div>

                  <p style="margin:0;color:#888;font-size:13px;line-height:1.6;">
                    If you didn't request this, you can safely ignore this email.
                    Never share this code with anyone.
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding:20px 40px;border-top:1px solid #f0f0f0;text-align:center;">
                  <p style="margin:0;color:#aaa;font-size:12px;">© ${new Date().getFullYear()} CivicConnect · Building better communities</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  await t.sendMail({
    from: `"CivicConnect" <${process.env.GMAIL_USER}>`,
    to,
    subject: `${otp} is your CivicConnect verification code`,
    html,
    text: `Your CivicConnect verification code is: ${otp}\n\nIt expires in 10 minutes. Never share it with anyone.`,
  });

  logger.info(`OTP email sent to ${to}`);
};
