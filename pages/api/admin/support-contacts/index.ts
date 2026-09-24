import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdminSession } from '../../../../lib/adminAuth';
import { isMissingSupabaseTableError } from '../../../../lib/supabaseErrors';
import { normalizeSupportContact, normalizeSupportContactInput, type SupportContactRecord } from '../../../../lib/supportContacts';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

const SELECT = 'id, name, phone, designation, category, note, display_order, is_available, created_at, updated_at';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireAdminSession(req, res)) return;

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin.from('support_contacts').select(SELECT).order('display_order').order('name');
    if (error) {
      if (isMissingSupabaseTableError(error)) return res.status(500).json({ error: 'Apply the support contacts migration.' });
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ contacts: ((data || []) as SupportContactRecord[]).map((row) => normalizeSupportContact(row, true)) });
  }

  if (req.method === 'POST') {
    try {
      const input = normalizeSupportContactInput(req.body);
      const { data, error } = await supabaseAdmin.from('support_contacts').insert(input).select(SELECT).single();
      if (error) {
        if (error.code === '23505') return res.status(409).json({ error: 'A support contact already uses this phone number.' });
        if (isMissingSupabaseTableError(error)) return res.status(500).json({ error: 'Apply the support contacts migration.' });
        return res.status(500).json({ error: error.message });
      }
      return res.status(201).json({ contact: normalizeSupportContact(data as SupportContactRecord, true) });
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid support contact.' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
