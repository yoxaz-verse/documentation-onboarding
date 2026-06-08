import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';
import { ensureOperatorSeed } from '../../../lib/ensureOperatorSeed';
import { generateOtp, hashOtp, OTP_TTL_MINUTES } from '../../../lib/otp';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

const MAX_PENDING_OTP = 3;

function buildOtpEmail(otp: string, ttlMinutes: number): { subject: string; text: string; html: string } {
  const subject = 'Your OBAOL OTP Code';
  const text = [
    'OBAOL - Sign-In Verification',
    '',
    `Your one-time password (OTP) is: ${otp}`,
    `This code expires in ${ttlMinutes} minutes.`,
    '',
    'If you did not request this code, you can safely ignore this email.',
    'This is an automated message. Please do not reply.',
    '',
    'OBAOL Security Team',
  ].join('\n');

  const html = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="x-ua-compatible" content="ie=edge" />
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f3f5f8;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#f3f5f8;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background-color:#0f172a;padding:20px 24px;">
                <p style="margin:0;font-size:18px;line-height:24px;font-weight:700;letter-spacing:0.5px;color:#ffffff;">OBAOL</p>
                <p style="margin:6px 0 0 0;font-size:13px;line-height:20px;color:#cbd5e1;">Secure Sign-In Verification</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 24px 12px 24px;">
                <p style="margin:0;font-size:20px;line-height:28px;font-weight:700;color:#0f172a;">Your One-Time Password</p>
                <p style="margin:12px 0 0 0;font-size:15px;line-height:24px;color:#334155;">
                  Use the code below to complete your OBAOL sign-in request.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 24px;">
                <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #cbd5e1;border-radius:10px;">
                  <tr>
                    <td align="center" style="padding:20px 12px;">
                      <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:36px;line-height:40px;letter-spacing:6px;font-weight:700;color:#0f172a;">
                        ${otp}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 24px 0 24px;">
                <p style="margin:0;font-size:14px;line-height:22px;color:#475569;">
                  This code expires in <strong>${ttlMinutes} minutes</strong>.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px 0 24px;">
                <p style="margin:0;font-size:13px;line-height:20px;color:#64748b;">
                  If you did not request this code, you can safely ignore this email.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 24px 24px 24px;">
                <p style="margin:0;font-size:12px;line-height:18px;color:#94a3b8;">
                  This is an automated security message from OBAOL. Please do not reply.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();

  return { subject, text, html };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'Valid email is required.' });

  const seedError = await ensureOperatorSeed(email);
  if (seedError) {
    return res.status(500).json({ error: `Failed to prepare operator record: ${seedError}` });
  }

  const nowIso = new Date().toISOString();
  const { count, error: countError } = await supabaseAdmin
    .from('otp_codes')
    .select('*', { count: 'exact', head: true })
    .eq('email', email)
    .is('consumed_at', null)
    .gte('expires_at', nowIso);

  if (countError) return res.status(500).json({ error: countError.message });
  if ((count || 0) >= MAX_PENDING_OTP) return res.status(429).json({ error: 'Too many active OTP requests. Try again later.' });

  const otp = generateOtp();
  const otpHash = hashOtp(email, otp);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString();

  const { error: insertError } = await supabaseAdmin.from('otp_codes').insert({
    email,
    otp_hash: otpHash,
    expires_at: expiresAt,
    attempts: 0,
  });

  if (insertError) return res.status(500).json({ error: insertError.message });

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    const emailContent = buildOtpEmail(otp, OTP_TTL_MINUTES);
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to send OTP email.' });
  }

  return res.status(200).json({ message: 'OTP sent successfully.' });
}
