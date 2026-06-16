import type { NextApiRequest, NextApiResponse } from 'next';
import { ensureOperatorSeed } from '../../../lib/ensureOperatorSeed';
import { areJourneyChecksComplete, buildJourneySummary, type JourneyCheckRecord } from '../../../lib/operatorJourney';
import { areCoursesUnlocked, normalizeProgressRecord } from '../../../lib/onboarding';
import { requireSession } from '../../../lib/serverAuth';
import { isMissingSupabaseTableError } from '../../../lib/supabaseErrors';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

function schemaError(res: NextApiResponse, table: string) {
  return res.status(500).json({
    error: `Database schema is not up to date. Apply the operator journey migration so ${table} is available.`,
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = requireSession(req, res);
  if (!session) return;

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const seedError = await ensureOperatorSeed(session.email);
  if (seedError) return res.status(500).json({ error: `Failed to ensure operator record: ${seedError}` });

  const [{ data: progress, error: progressError }, { data: checkRows, error: checkError }, { data: existingState, error: stateReadError }] = await Promise.all([
    supabaseAdmin
      .from('operator_progress')
      .select('*')
      .eq('email', session.email)
      .maybeSingle(),
    supabaseAdmin
      .from('operator_journey_check_state')
      .select('check_id, completed_at')
      .eq('email', session.email),
    supabaseAdmin
      .from('operator_journey_state')
      .select('email, started_at, created_at, updated_at')
      .eq('email', session.email)
      .maybeSingle(),
  ]);

  if (progressError) return res.status(500).json({ error: progressError.message });
  if (checkError) {
    if (isMissingSupabaseTableError(checkError)) return schemaError(res, 'operator_journey_check_state');
    return res.status(500).json({ error: checkError.message });
  }
  if (stateReadError) {
    if (isMissingSupabaseTableError(stateReadError)) return schemaError(res, 'operator_journey_state');
    return res.status(500).json({ error: stateReadError.message });
  }

  const normalizedProgress = normalizeProgressRecord(progress);
  if (!areCoursesUnlocked(normalizedProgress)) {
    return res.status(403).json({ error: 'Complete onboarding before starting the operator journey.' });
  }

  const completedCheckIds = (checkRows || []).map((row) => row.check_id);
  if (!areJourneyChecksComplete(completedCheckIds)) {
    return res.status(400).json({ error: 'Complete every preflight check before starting Day 1.' });
  }

  if (existingState?.started_at) {
    return res.status(200).json({
      journey: buildJourneySummary(existingState, (checkRows || []) as JourneyCheckRecord[]),
    });
  }

  const now = new Date().toISOString();
  const { data: state, error: upsertError } = await supabaseAdmin
    .from('operator_journey_state')
    .upsert({ email: session.email, started_at: now, updated_at: now }, { onConflict: 'email' })
    .select('email, started_at, created_at, updated_at')
    .single();

  if (upsertError) {
    if (isMissingSupabaseTableError(upsertError)) return schemaError(res, 'operator_journey_state');
    return res.status(500).json({ error: upsertError.message });
  }

  return res.status(200).json({
    journey: buildJourneySummary(state, (checkRows || []) as JourneyCheckRecord[]),
  });
}
