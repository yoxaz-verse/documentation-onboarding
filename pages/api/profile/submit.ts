import type { NextApiRequest, NextApiResponse } from 'next';
import { ensureOperatorSeed } from '../../../lib/ensureOperatorSeed';
import { buildProgressUpdate, normalizeProgressRecord } from '../../../lib/onboarding';
import { requireSession } from '../../../lib/serverAuth';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

const requiredFields = [
  'full_name',
  'phone',
  'role_title',
  'city',
  'total_work_experience_years',
  'group_trading_experience_years',
  'preferred_language',
  'operator_background',
  'motivation',
  'official_company_email',
] as const;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = requireSession(req, res);
  if (!session) return;

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const seedError = await ensureOperatorSeed(session.email);
  if (seedError) return res.status(500).json({ error: `Failed to ensure operator record: ${seedError}` });

  const values: Record<string, string> = {};
  for (const key of requiredFields) {
    const value = req.body?.[key];
    values[key] = typeof value === 'string' ? value.trim() : '';
  }
  values.state = 'Gautam';

  const missing = requiredFields.filter((field) => !values[field]);
  if (missing.length > 0) {
    return res.status(400).json({ error: `Please complete all required fields before submit.` });
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('operator_profiles')
    .upsert({ email: session.email, ...values }, { onConflict: 'email' })
    .select('*')
    .single();

  if (profileError) return res.status(500).json({ error: profileError.message });

  const { data: progress, error: progressError } = await supabaseAdmin
    .from('operator_progress')
    .select('*')
    .eq('email', session.email)
    .maybeSingle();

  if (progressError) return res.status(500).json({ error: progressError.message });

  let ensuredProgress = progress;
  if (!ensuredProgress) {
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('operator_progress')
      .insert({ email: session.email, ...buildProgressUpdate(1) })
      .select('*')
      .single();

    if (insertError) return res.status(500).json({ error: insertError.message });
    ensuredProgress = inserted;
  }

  return res.status(200).json({ profile, progress: normalizeProgressRecord(ensuredProgress), completed: true });
}
