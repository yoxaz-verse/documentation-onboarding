import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdminSession } from '../../../../lib/adminAuth';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_STATUSES = new Set(['invited', 'active', 'disabled']);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = requireAdminSession(req, res);
  if (!session) return;
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });

  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
  const now = new Date().toISOString();

  const status = String(req.body?.status || '');
  if (!VALID_STATUSES.has(status) || status === 'invited') {
    return res.status(400).json({ error: 'Status must be active or disabled.' });
  }
  const changes = status === 'disabled'
    ? { invitation_status: status, disabled_at: now }
    : { invitation_status: status, activated_at: now, disabled_at: null };
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
