import type { NextApiRequest, NextApiResponse } from 'next';
import { ensureOperatorSeed } from '../../../lib/ensureOperatorSeed';
import { buildProgressUpdate, FINAL_MILESTONE, getCurrentStep, normalizeProgressRecord } from '../../../lib/onboarding';
import { requireSession } from '../../../lib/serverAuth';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = requireSession(req, res);
  if (!session) return;

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const seedError = await ensureOperatorSeed(session.email);
  if (seedError) return res.status(500).json({ error: `Failed to ensure operator record: ${seedError}` });

  const step = Number(req.body?.step);
  if (!Number.isInteger(step) || step < 1 || step > FINAL_MILESTONE) return res.status(400).json({ error: 'Invalid step.' });

  const { data: existing, error: existingError } = await supabaseAdmin
    .from('operator_progress')
    .select('*')
    .eq('email', session.email)
    .maybeSingle();

  if (existingError) return res.status(500).json({ error: existingError.message });

  const completedAt = new Date().toISOString();
  const payload = buildProgressUpdate(Math.max(getCurrentStep(existing), step + 1), existing, completedAt);

  const { data, error } = await supabaseAdmin
    .from('operator_progress')
    .upsert({ email: session.email, ...payload }, { onConflict: 'email' })
    .select('*')
    .single();

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ progress: normalizeProgressRecord(data) });
}
