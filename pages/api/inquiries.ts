import type { NextApiRequest, NextApiResponse } from 'next';
import { normalizePublicLiveInquiry, type LiveInquiryRecord } from '../../lib/inquiries';
import { requireSession } from '../../lib/serverAuth';
import { isMissingSupabaseTableError } from '../../lib/supabaseErrors';
import { supabaseAdmin } from '../../lib/supabaseAdmin';

function schemaError(res: NextApiResponse) {
  return res.status(500).json({ error: 'Database schema is not up to date. Apply the live inquiries migration.' });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = requireSession(req, res);
  if (!session) return;

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { data, error } = await supabaseAdmin
    .from('live_inquiries')
    .select('id, title, order_summary, products, is_published, created_at, updated_at')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (error) {
    if (isMissingSupabaseTableError(error)) return schemaError(res);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ inquiries: ((data || []) as LiveInquiryRecord[]).map(normalizePublicLiveInquiry) });
}
