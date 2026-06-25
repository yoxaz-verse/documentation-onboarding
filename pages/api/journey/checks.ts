import type { NextApiRequest, NextApiResponse } from 'next';
import { ensureOperatorSeed } from '../../../lib/ensureOperatorSeed';
import { isValidJourneyCheckId } from '../../../lib/operatorJourney';
import { areCoursesUnlocked, normalizeProgressRecord } from '../../../lib/onboarding';
import { requireSession } from '../../../lib/serverAuth';
import { isMissingSupabaseTableError } from '../../../lib/supabaseErrors';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = requireSession(req, res);
  if (!session) return;

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const checkId = String(req.body?.checkId || '').trim();
  const completed = Boolean(req.body?.completed);

  if (!isValidJourneyCheckId(checkId)) return res.status(400).json({ error: 'Invalid journey check.' });

  const seedError = await ensureOperatorSeed(session.email);
  if (seedError) return res.status(500).json({ error: `Failed to ensure operator record: ${seedError}` });

  const { data: progress, error: progressError } = await supabaseAdmin
    .from('operator_progress')
    .select('email, current_step')
    .eq('email', session.email)
    .maybeSingle();

  if (progressError) return res.status(500).json({ error: progressError.message });
  if (!areCoursesUnlocked(normalizeProgressRecord(progress))) {
    return res.status(403).json({ error: 'Complete Step 10 before updating journey checks.' });
  }

  if (completed) {
    const now = new Date().toISOString();
    const { error } = await supabaseAdmin
      .from('operator_journey_check_state')
      .upsert({ email: session.email, check_id: checkId, completed_at: now }, { onConflict: 'email,check_id' });

    if (error) {
      if (isMissingSupabaseTableError(error)) {
        return res.status(500).json({ error: 'Database schema is not up to date. Apply the operator journey migration.' });
      }
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ checkId, completed: true });
  }

  const { error } = await supabaseAdmin
    .from('operator_journey_check_state')
    .delete()
    .eq('email', session.email)
    .eq('check_id', checkId);

  if (error) {
    if (isMissingSupabaseTableError(error)) {
      return res.status(500).json({ error: 'Database schema is not up to date. Apply the operator journey migration.' });
    }
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ checkId, completed: false });
}
