import type { NextApiRequest, NextApiResponse } from 'next';
import { requireSession } from '../../lib/serverAuth';
import { isMissingSupabaseTableError } from '../../lib/supabaseErrors';
import { normalizeSupportContact, type SupportContactRecord } from '../../lib/supportContacts';
import { supabaseAdmin } from '../../lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireSession(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { data, error } = await supabaseAdmin
    .from('support_contacts')
    .select('id, name, phone, designation, category, note, display_order, is_available, created_at, updated_at')
    .eq('is_available', true)
    .order('display_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    if (isMissingSupabaseTableError(error)) return res.status(500).json({ error: 'Support contacts are not configured yet.' });
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ contacts: ((data || []) as SupportContactRecord[]).map((row) => normalizeSupportContact(row)) });
}
