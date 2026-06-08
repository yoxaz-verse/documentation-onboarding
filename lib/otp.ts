import crypto from 'crypto';

export const OTP_TTL_MINUTES = 10;

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function hashOtp(email: string, otp: string): string {
  const secret = process.env.SESSION_SECRET || '';
  return crypto.createHash('sha256').update(`${email}:${otp}:${secret}`).digest('hex');
}
