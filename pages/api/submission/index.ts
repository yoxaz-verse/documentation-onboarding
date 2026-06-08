import type { NextApiRequest, NextApiResponse } from 'next';
import { ensureOperatorSeed } from '../../../lib/ensureOperatorSeed';
import { FINAL_MILESTONE, generateCompletionCode, getCurrentStep } from '../../../lib/onboarding';
import { requireSession } from '../../../lib/serverAuth';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = requireSession(req, res);
  if (!session) return;

  const seedError = await ensureOperatorSeed(session.email);
  if (seedError) return res.status(500).json({ error: `Failed to ensure operator record: ${seedError}` });

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('onboarding_submissions')
      .select('completion_code')
      .eq('email', session.email)
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ completionCode: data?.completion_code || null });
  }

  if (req.method === 'POST') {
    const { data: progress, error: progressError } = await supabaseAdmin
      .from('operator_progress')
      .select('current_step')
      .eq('email', session.email)
      .maybeSingle();

    if (progressError) return res.status(500).json({ error: progressError.message });

    if (getCurrentStep(progress) <= FINAL_MILESTONE) {
      return res.status(403).json({ error: 'Complete the full guided onboarding flow before final submission.' });
    }

    const code = String(req.body?.completionCode || '').trim() || generateCompletionCode();

    const { error } = await supabaseAdmin.from('onboarding_submissions').upsert(
      {
        email: session.email,
        status: 'completed',
        completion_code: code,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: 'email' }
    );

    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ completionCode: code });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
