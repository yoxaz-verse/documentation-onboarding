import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdminSession } from '../../../../../lib/adminAuth';
import { isMissingSupabaseTableError } from '../../../../../lib/supabaseErrors';
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = requireAdminSession(req, res);
  if (!session) return;

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  let query = supabaseAdmin
    .from('operator_journey_day_submissions')
    .select('id, email, template_id, day_number, status, answers, computed_metrics, submitted_at, reviewed_at, reviewed_by, review_note, created_at, updated_at')
    .order('updated_at', { ascending: false })
    .limit(100);

  const status = String(req.query.status || '').trim();
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) {
    if (isMissingSupabaseTableError(error)) return res.status(500).json({ error: 'Database schema is not up to date. Apply the full journey workflow migration.' });
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ submissions: data || [] });
}
