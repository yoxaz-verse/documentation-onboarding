import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdminSession } from '../../../lib/adminAuth';
import type { AdminOverview } from '../../../lib/adminTypes';
import { FINAL_MILESTONE, getCompletedMilestoneCount, MILESTONES, normalizeProgressRecord } from '../../../lib/onboarding';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = requireAdminSession(req, res);
  if (!session) return;

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { data, error } = await supabaseAdmin
    .from('operator_progress')
    .select('current_step');

  if (error) return res.status(500).json({ error: error.message });

  const rows = (data || []).map((row) => normalizeProgressRecord(row)).filter(Boolean);
  const totalOperators = rows.length;
  const stepCompletion = MILESTONES.map((milestone) => ({
    step: milestone.number,
    label: milestone.label,
    count: rows.filter((row) => getCompletedMilestoneCount(row) >= milestone.number).length,
  }));
  const completedOperators = rows.filter((row) => getCompletedMilestoneCount(row) >= FINAL_MILESTONE).length;
  const inProgressOperators = Math.max(totalOperators - completedOperators, 0);
  const completionRate = totalOperators > 0 ? Math.round((completedOperators / totalOperators) * 100) : 0;

  const overview: AdminOverview = {
    totalOperators,
    completedOperators,
    inProgressOperators,
    completionRate,
    stepCompletion,
  };

  return res.status(200).json({ overview });
}
