import type { NextApiRequest, NextApiResponse } from 'next';
import { ensureOperatorSeed } from '../../../lib/ensureOperatorSeed';
import { isValidJourneyMilestoneId } from '../../../lib/operatorJourney';
import { requireSession } from '../../../lib/serverAuth';
import { isMissingSupabaseTableError } from '../../../lib/supabaseErrors';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = requireSession(req, res);
  if (!session) return;

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const milestoneId = String(req.body?.milestoneId || '').trim();
  const completed = Boolean(req.body?.completed);

  if (!isValidJourneyMilestoneId(milestoneId)) return res.status(400).json({ error: 'Invalid journey milestone.' });

  const seedError = await ensureOperatorSeed(session.email);
  if (seedError) return res.status(500).json({ error: `Failed to ensure operator record: ${seedError}` });

  if (completed) {
    const now = new Date().toISOString();
    const { error } = await supabaseAdmin
      .from('operator_journey_milestone_state')
      .upsert({ email: session.email, milestone_id: milestoneId, completed_at: now }, { onConflict: 'email,milestone_id' });

    if (error) {
      if (isMissingSupabaseTableError(error)) {
        return res.status(500).json({ error: 'Database schema is not up to date. Apply the operator journey migration.' });
      }
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ milestoneId, completed: true });
  }

  const { error } = await supabaseAdmin
    .from('operator_journey_milestone_state')
    .delete()
    .eq('email', session.email)
    .eq('milestone_id', milestoneId);

  if (error) {
    if (isMissingSupabaseTableError(error)) {
      return res.status(500).json({ error: 'Database schema is not up to date. Apply the operator journey migration.' });
    }
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ milestoneId, completed: false });
}
