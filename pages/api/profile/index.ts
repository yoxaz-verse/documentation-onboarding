import type { NextApiRequest, NextApiResponse } from 'next';
import { ensureOperatorSeed } from '../../../lib/ensureOperatorSeed';
import { requireSession } from '../../../lib/serverAuth';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

function defaults(email: string) {
  return {
    email,
    full_name: '',
    phone: '',
    role_title: '',
    city: '',
    state: '',
    years_experience: '',
    total_work_experience_years: '',
    group_trading_experience_years: '',
    preferred_language: '',
    operator_background: '',
    motivation: '',
    official_company_email: '',
    zoho_acknowledged_at: null,
    zoho_contact_revealed_at: null,
    zoho_support_stage: 'pending',
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = requireSession(req, res);
  if (!session) return;

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const seedError = await ensureOperatorSeed(session.email);
  if (seedError) return res.status(500).json({ error: `Failed to ensure operator record: ${seedError}` });

  const { data, error } = await supabaseAdmin
    .from('operator_profiles')
    .select('*')
    .eq('email', session.email)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });

  if (data) return res.status(200).json({ profile: data });

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('operator_profiles')
    .insert(defaults(session.email))
    .select('*')
    .single();

  if (insertError) return res.status(500).json({ error: insertError.message });

  return res.status(200).json({ profile: inserted });
}
