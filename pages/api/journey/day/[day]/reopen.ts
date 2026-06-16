import type { NextApiRequest, NextApiResponse } from 'next';
import { requireSession } from '../../../../../lib/serverAuth';
import { isMissingSupabaseTableError } from '../../../../../lib/supabaseErrors';
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = requireSession(req, res);
  if (!session) return;

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const day = Number(req.query.day);
  if (!Number.isInteger(day) || day < 1 || day > 30) return res.status(400).json({ error: 'Invalid journey day.' });

  const { data: existing, error: findError } = await supabaseAdmin
    .from('operator_journey_day_submissions')
    .select('id, template_id, status')
    .eq('email', session.email)
    .eq('day_number', day)
    .maybeSingle();

  if (findError) {
    if (isMissingSupabaseTableError(findError)) return res.status(500).json({ error: 'Database schema is not up to date. Apply the full journey workflow migration.' });
    return res.status(500).json({ error: findError.message });
  }
  if (!existing) return res.status(404).json({ error: 'No submission found for this day.' });

  const { data, error } = await supabaseAdmin
    .from('operator_journey_day_submissions')
    .update({ status: 'pending', reviewed_at: null, reviewed_by: null, review_note: null })
    .eq('id', existing.id)
    .eq('email', session.email)
    .select('id, email, template_id, day_number, status, answers, computed_metrics, submitted_at, reviewed_at, reviewed_by, review_note, created_at, updated_at')
    .single();

  if (error) return res.status(500).json({ error: error.message });

  await supabaseAdmin
    .from('operator_journey_milestone_state')
    .delete()
    .eq('email', session.email)
    .eq('milestone_id', existing.template_id);

  return res.status(200).json({ submission: data });
}
