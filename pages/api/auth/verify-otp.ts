import type { NextApiRequest, NextApiResponse } from 'next';
import { ensureOperatorSeed } from '../../../lib/ensureOperatorSeed';
import { buildProgressUpdate } from '../../../lib/onboarding';
import { hashOtp } from '../../../lib/otp';
import { setSessionCookie } from '../../../lib/session';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

const MAX_ATTEMPTS = 5;
const RECENT_CONSUMED_LOOKBACK_MINUTES = 10;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.SESSION_SECRET) return res.status(500).json({ error: 'Server auth is not configured.' });

  const email = String(req.body?.email || '').trim().toLowerCase();
  const otp = String(req.body?.otp || '').trim();
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required.' });

  const nowIso = new Date().toISOString();
  const { data: codeRow, error } = await supabaseAdmin
    .from('otp_codes')
    .select('id, otp_hash, attempts, expires_at')
    .eq('email', email)
    .is('consumed_at', null)
    .gte('expires_at', nowIso)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('verify-otp: active code lookup failed', { email, error: error.message });
    return res.status(500).json({ error: error.message });
  }
  if (!codeRow) {
    console.debug('verify-otp: no active code', { email, nowIso });
    const consumedSinceIso = new Date(Date.now() - RECENT_CONSUMED_LOOKBACK_MINUTES * 60 * 1000).toISOString();
    const { data: recentlyConsumed, error: consumedLookupError } = await supabaseAdmin
      .from('otp_codes')
      .select('id, otp_hash, consumed_at, created_at')
      .eq('email', email)
      .not('consumed_at', 'is', null)
      .gte('consumed_at', consumedSinceIso)
      .order('consumed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (consumedLookupError) {
      console.error('verify-otp: consumed code lookup failed', { email, error: consumedLookupError.message });
    }

    if (recentlyConsumed && recentlyConsumed.otp_hash === hashOtp(email, otp)) {
      console.debug('verify-otp: reused recently consumed code', {
        email,
        codeId: recentlyConsumed.id,
        consumedAt: recentlyConsumed.consumed_at,
      });
      return res.status(400).json({
        code: 'already_used_code',
        error: 'This OTP was already used. Please request a new OTP.',
      });
    }

    return res.status(400).json({
      code: 'no_active_code',
      error: 'No active OTP found. Please request a new OTP.',
    });
  }

  console.debug('verify-otp: active code found', {
    email,
    codeId: codeRow.id,
    attempts: codeRow.attempts,
    expiresAt: codeRow.expires_at,
  });

  if (codeRow.attempts >= MAX_ATTEMPTS) {
    console.debug('verify-otp: attempt limit reached', { email, codeId: codeRow.id, attempts: codeRow.attempts });
    return res.status(429).json({
      code: 'attempt_limit',
      error: 'Maximum OTP attempts exceeded. Request a new OTP.',
    });
  }

  const valid = codeRow.otp_hash === hashOtp(email, otp);
  if (!valid) {
    await supabaseAdmin.from('otp_codes').update({ attempts: codeRow.attempts + 1 }).eq('id', codeRow.id);
    console.debug('verify-otp: code mismatch', { email, codeId: codeRow.id, attempts: codeRow.attempts + 1 });
    return res.status(400).json({ code: 'code_mismatch', error: 'Incorrect OTP.' });
  }

  const consumedAt = new Date().toISOString();
  const { error: consumeError } = await supabaseAdmin
    .from('otp_codes')
    .update({ consumed_at: consumedAt })
    .eq('id', codeRow.id);
  if (consumeError) {
    console.error('verify-otp: failed to consume code', { email, codeId: codeRow.id, error: consumeError.message });
    return res.status(500).json({ error: 'Failed to finalize OTP verification.' });
  }
  console.debug('verify-otp: code consumed', { email, codeId: codeRow.id, consumedAt });

  const { data: operator } = await supabaseAdmin
    .from('operators')
    .select('name')
    .eq('email', email)
    .maybeSingle();

  const seedError = await ensureOperatorSeed(email);
  if (seedError) return res.status(500).json({ error: `Failed to prepare operator record: ${seedError}` });

  const { data: existingProgress, error: progressLookupError } = await supabaseAdmin
    .from('operator_progress')
    .select('email')
    .eq('email', email)
    .maybeSingle();

  if (progressLookupError) return res.status(500).json({ error: progressLookupError.message });

  if (!existingProgress) {
    const { error: progressInsertError } = await supabaseAdmin
      .from('operator_progress')
      .insert({ email, ...buildProgressUpdate(1, null, consumedAt) });

    if (progressInsertError) return res.status(500).json({ error: progressInsertError.message });
  }

  setSessionCookie(res, { email, name: operator?.name || null });
  console.debug('verify-otp: session cookie issued', {
    email,
    hasCookieHeader: Boolean(res.getHeader('Set-Cookie')),
    otpValidated: true,
  });
  return res.status(200).json({
    authenticated: true,
    next: '/',
    message: 'OTP verified.',
    user: { email, name: operator?.name || null },
  });
}
