import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdminSession } from '../../../../lib/adminAuth';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_STATUSES = new Set(['invited', 'active', 'disabled']);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = requireAdminSession(req, res);
  if (!session) return;
  if (req.method !== 'POST' && req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });

  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
  const now = new Date().toISOString();

  if (req.method === 'POST') {
    const { data: existing, error: lookupError } = await supabaseAdmin
      .from('operators')
      .select('email, invitation_status')
      .eq('email', email)
      .maybeSingle();
    if (lookupError) return res.status(500).json({ error: lookupError.message });
    if (existing && existing.invitation_status !== 'disabled') {
      return res.status(409).json({ error: 'This email already has an invitation.' });
    }

    const payload = { email, invitation_status: 'invited', invited_at: now, disabled_at: null };
    const query = existing
      ? supabaseAdmin.from('operators').update(payload).eq('email', email)
      : supabaseAdmin.from('operators').insert(payload);
    const { error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(existing ? 200 : 201).json({ operator: payload });
  }

  const status = String(req.body?.status || '');
  if (!VALID_STATUSES.has(status) || status === 'active') {
    return res.status(400).json({ error: 'Status must be invited or disabled.' });
  }
  const changes = status === 'disabled'
    ? { invitation_status: status, disabled_at: now }
    : { invitation_status: status, invited_at: now, disabled_at: null };
  const { data, error } = await supabaseAdmin
    .from('operators')
    .update(changes)
    .eq('email', email)
    .select('email, invitation_status, invited_at, activated_at, disabled_at')
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Operator invitation not found.' });
  return res.status(200).json({ operator: data });
}
