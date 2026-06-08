import type { NextApiRequest, NextApiResponse } from 'next';
import { ensureOperatorSeed } from '../../../lib/ensureOperatorSeed';
import { requireSession } from '../../../lib/serverAuth';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

const allowedKeys = [
  'full_name',
  'phone',
  'role_title',
  'city',
  'state',
  'years_experience',
  'total_work_experience_years',
  'group_trading_experience_years',
  'preferred_language',
  'operator_background',
  'motivation',
  'official_company_email',
  'zoho_acknowledged_at',
  'zoho_contact_revealed_at',
  'zoho_support_stage',
] as const;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = requireSession(req, res);
  if (!session) return;

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const seedError = await ensureOperatorSeed(session.email);
  if (seedError) return res.status(500).json({ error: `Failed to ensure operator record: ${seedError}` });

  const updates: Record<string, string> = {};
  for (const key of allowedKeys) {
    const value = req.body?.[key];
    if (typeof value === 'string') updates[key] = value.trim();
  }

  if (typeof updates.city === 'string' && updates.city.length > 0) {
    updates.state = 'Gautam';
  }

  const payload = { email: session.email, ...updates };

  const { data, error } = await supabaseAdmin
    .from('operator_profiles')
    .upsert(payload, { onConflict: 'email' })
    .select('*')
    .single();

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ profile: data });
}
