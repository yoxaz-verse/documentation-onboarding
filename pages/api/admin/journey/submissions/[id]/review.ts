import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdminSession } from '../../../../../../lib/adminAuth';
import { isMissingSupabaseTableError } from '../../../../../../lib/supabaseErrors';
import { supabaseAdmin } from '../../../../../../lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = requireAdminSession(req, res);
  if (!session) return;

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const id = String(req.query.id || '').trim();
  const action = String(req.body?.action || '').trim();
  const reviewNote = String(req.body?.reviewNote || '').trim();
  const readinessStatus = String(req.body?.readinessStatus || '').trim();

  if (!id) return res.status(400).json({ error: 'Missing submission id.' });
  if (!['approve', 'needs_correction'].includes(action)) return res.status(400).json({ error: 'Invalid review action.' });
  if (action === 'needs_correction' && !reviewNote) return res.status(400).json({ error: 'Correction note is required.' });

  const { data: existing, error: findError } = await supabaseAdmin
    .from('operator_journey_day_submissions')
    .select('id, email, template_id, day_number, answers, computed_metrics')
    .eq('id', id)
    .maybeSingle();

  if (findError) {
    if (isMissingSupabaseTableError(findError)) return res.status(500).json({ error: 'Database schema is not up to date. Apply the full journey workflow migration.' });
    return res.status(500).json({ error: findError.message });
  }
  if (!existing) return res.status(404).json({ error: 'Submission not found.' });

  const now = new Date().toISOString();
  const status = action === 'approve' ? 'completed' : 'needs_correction';
  const computedMetrics = {
    ...(existing.computed_metrics || {}),
    ...(readinessStatus ? { readinessStatus } : {}),
  };

  const { data, error } = await supabaseAdmin
    .from('operator_journey_day_submissions')
    .update({
      status,
      computed_metrics: computedMetrics,
      reviewed_at: now,
      reviewed_by: session.username,
      review_note: reviewNote || (readinessStatus ? `Readiness status: ${readinessStatus}` : null),
    })
    .eq('id', id)
    .select('id, email, template_id, day_number, status, answers, computed_metrics, submitted_at, reviewed_at, reviewed_by, review_note, created_at, updated_at')
    .single();

  if (error) return res.status(500).json({ error: error.message });

  if (status === 'completed') {
    await supabaseAdmin
      .from('operator_journey_milestone_state')
      .upsert({ email: existing.email, milestone_id: existing.template_id, completed_at: now }, { onConflict: 'email,milestone_id' });
  } else {
    await supabaseAdmin
      .from('operator_journey_milestone_state')
      .delete()
      .eq('email', existing.email)
      .eq('milestone_id', existing.template_id);
  }

  return res.status(200).json({ submission: data });
}
