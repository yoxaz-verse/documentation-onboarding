import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdminSession } from '../../../../lib/adminAuth';
import { normalizeSupportContact, normalizeSupportContactInput, type SupportContactRecord } from '../../../../lib/supportContacts';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

const SELECT = 'id, name, phone, designation, category, note, display_order, is_available, created_at, updated_at';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireAdminSession(req, res)) return;
  const id = String(req.query.id || '');
  if (!id) return res.status(400).json({ error: 'Contact id is required.' });

  if (req.method === 'PUT') {
    try {
      const input = normalizeSupportContactInput(req.body);
      const { data, error } = await supabaseAdmin.from('support_contacts').update(input).eq('id', id).select(SELECT).single();
      if (error) {
        if (error.code === '23505') return res.status(409).json({ error: 'A support contact already uses this phone number.' });
        return res.status(500).json({ error: error.message });
      }
      return res.status(200).json({ contact: normalizeSupportContact(data as SupportContactRecord, true) });
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid support contact.' });
    }
  }

  if (req.method === 'DELETE') {
    const { error } = await supabaseAdmin.from('support_contacts').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).end();
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
