import type { NextApiRequest, NextApiResponse } from 'next';
import { requireSession } from '../../../lib/serverAuth';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import type { JourneyLeaderboardResponse, JourneyLeaderboardSummary } from '../../../lib/types';

type RankingRow = {
  email: string;
  rank: number;
  operatingDay: number;
  currentLevel: number | null;
  completedLevels: number;
  isCurrentUser: boolean;
};

type RankingResult = {
  summary: JourneyLeaderboardSummary | null;
  entries: RankingRow[];
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = requireSession(req, res);
  if (!session) return;

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { data, error } = await supabaseAdmin.rpc('get_operator_journey_leaderboard', {
    p_email: session.email,
    p_limit: 10,
  });

  if (error) return res.status(500).json({ error: error.message });

  const ranking = (data || { summary: null, entries: [] }) as RankingResult;
  const emails = ranking.entries.map((entry) => entry.email);
  const [{ data: operators }, { data: profiles }] = emails.length
    ? await Promise.all([
        supabaseAdmin.from('operators').select('email, name').in('email', emails),
        supabaseAdmin.from('operator_profiles').select('email, full_name').in('email', emails),
      ])
    : [{ data: [] }, { data: [] }];

  const operatorNames = new Map((operators || []).map((operator) => [operator.email, operator.name]));
  const profileNames = new Map((profiles || []).map((profile) => [profile.email, profile.full_name]));
  const response: JourneyLeaderboardResponse = {
    summary: ranking.summary,
    entries: ranking.entries.map(({ email, ...entry }) => ({
      ...entry,
      id: `journey-rank-${entry.rank}`,
      displayName: profileNames.get(email) || operatorNames.get(email) || email.split('@')[0],
    })),
  };

  res.setHeader('Cache-Control', 'private, no-store');
  return res.status(200).json(response);
}
