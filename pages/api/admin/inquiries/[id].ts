import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdminSession } from '../../../../lib/adminAuth';
import { normalizeInquiryInput, normalizeLiveInquiry, toInquiryRow, type LiveInquiryRecord } from '../../../../lib/inquiries';
import { isMissingSupabaseTableError } from '../../../../lib/supabaseErrors';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

function schemaError(res: NextApiResponse) {
  return res.status(500).json({ error: 'Database schema is not up to date. Apply the live inquiries migration.' });
}

function getId(value: string | string[] | undefined) {
  return String(Array.isArray(value) ? value[0] : value || '').trim();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = requireAdminSession(req, res);
  if (!session) return;

  const id = getId(req.query.id);
  if (!id) return res.status(400).json({ error: 'Inquiry id is required.' });

  if (req.method === 'PUT') {
    let input;
    try {
      input = normalizeInquiryInput(req.body);
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid inquiry.' });
    }

    const { data, error } = await supabaseAdmin
      .from('live_inquiries')
      .update(toInquiryRow(input))
      .eq('id', id)
      .select('id, title, order_summary, products, is_published, created_at, updated_at')
      .maybeSingle();

    if (error) {
      if (isMissingSupabaseTableError(error)) return schemaError(res);
      return res.status(500).json({ error: error.message });
    }
    if (!data) return res.status(404).json({ error: 'Inquiry not found.' });

    return res.status(200).json({ inquiry: normalizeLiveInquiry(data as LiveInquiryRecord) });
  }

  if (req.method === 'DELETE') {
    const { error } = await supabaseAdmin.from('live_inquiries').delete().eq('id', id);

    if (error) {
      if (isMissingSupabaseTableError(error)) return schemaError(res);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
