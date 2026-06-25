import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdminSession } from '../../../../lib/adminAuth';
import { normalizeInquiryInput, normalizeLiveInquiry, toInquiryRow, type LiveInquiryRecord } from '../../../../lib/inquiries';
import { isMissingSupabaseTableError } from '../../../../lib/supabaseErrors';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

function schemaError(res: NextApiResponse) {
  return res.status(500).json({ error: 'Database schema is not up to date. Apply the live inquiries migration.' });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = requireAdminSession(req, res);
  if (!session) return;

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('live_inquiries')
      .select('id, title, order_summary, products, is_published, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      if (isMissingSupabaseTableError(error)) return schemaError(res);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ inquiries: ((data || []) as LiveInquiryRecord[]).map(normalizeLiveInquiry) });
  }

  if (req.method === 'POST') {
    let input;
    try {
      input = normalizeInquiryInput(req.body);
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid inquiry.' });
    }

    const { data, error } = await supabaseAdmin
      .from('live_inquiries')
      .insert(toInquiryRow(input))
      .select('id, title, order_summary, products, is_published, created_at, updated_at')
      .single();

    if (error) {
      if (isMissingSupabaseTableError(error)) return schemaError(res);
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json({ inquiry: normalizeLiveInquiry(data as LiveInquiryRecord) });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
