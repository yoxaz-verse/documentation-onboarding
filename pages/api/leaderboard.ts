import type { NextApiRequest, NextApiResponse } from 'next';
import { buildLeaderboardEntries } from '../../lib/leaderboard';
import { requireSession } from '../../lib/serverAuth';
import { supabaseAdmin } from '../../lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = requireSession(req, res);
  if (!session) return;

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const [{ data: operators, error: operatorsError }, { data: profiles, error: profilesError }, { data: quizRows, error: quizError }] = await Promise.all([
    supabaseAdmin.from('operators').select('email, name'),
    supabaseAdmin.from('operator_profiles').select('email, full_name'),
    supabaseAdmin.from('quiz_performance').select('email, module_id, ever_passed, last_attempt_at'),
  ]);

  if (operatorsError) return res.status(500).json({ error: operatorsError.message });
  if (profilesError) return res.status(500).json({ error: profilesError.message });
  if (quizError) return res.status(500).json({ error: quizError.message });

  const leaderboard = buildLeaderboardEntries(operators || [], profiles || [], quizRows || [], session.email).slice(0, 12);

  return res.status(200).json({ leaderboard });
}
