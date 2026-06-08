import type { NextApiRequest, NextApiResponse } from 'next';
import { buildCourseProgressSummary } from '../../../lib/courseProgress';
import { ensureOperatorSeed } from '../../../lib/ensureOperatorSeed';
import { normalizeProgressRecord } from '../../../lib/onboarding';
import { requireSession } from '../../../lib/serverAuth';
import { isMissingSupabaseTableError } from '../../../lib/supabaseErrors';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

type SubmoduleStateRow = {
  submodule_id: string;
  draft_answers: Record<string, string> | null;
  status: 'locked' | 'in_progress' | 'passed';
  updated_at: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = requireSession(req, res);
  if (!session) return;

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const seedError = await ensureOperatorSeed(session.email);
  if (seedError) {
    return res.status(500).json({ error: `Failed to ensure operator record: ${seedError}` });
  }

  const { data, error } = await supabaseAdmin
    .from('operator_progress')
    .select('*')
    .eq('email', session.email)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });

  let progress = data;

  if (!progress) {
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('operator_progress')
      .insert({ email: session.email, current_step: 1 })
      .select('*')
      .single();

    if (insertError) return res.status(500).json({ error: insertError.message });
    progress = inserted;
  }

  const [{ data: passedRows, error: passedError }, { data: submoduleRows, error: submoduleError }] = await Promise.all([
    supabaseAdmin.from('quiz_attempts').select('module_id').eq('email', session.email).eq('passed', true),
    supabaseAdmin
      .from('course_submodule_state')
      .select('submodule_id, draft_answers, status, updated_at')
      .eq('email', session.email)
      .order('updated_at', { ascending: false }),
  ]);

  if (passedError) return res.status(500).json({ error: passedError.message });
  if (submoduleError && !isMissingSupabaseTableError(submoduleError)) {
    return res.status(500).json({ error: submoduleError.message });
  }

  const rows = (submoduleRows || []) as SubmoduleStateRow[];

  const draftBySubModuleId = rows.reduce<Record<string, Record<string, string>>>((acc, row) => {
    acc[row.submodule_id] = row.draft_answers || {};
    return acc;
  }, {});

  const activeCandidate = rows.find((row) => row.status !== 'passed')?.submodule_id || null;

  const passedSubModuleIds = new Set((passedRows || []).map((row) => row.module_id));
  const courseProgress = buildCourseProgressSummary(passedSubModuleIds, draftBySubModuleId, activeCandidate);

  return res.status(200).json({ progress: normalizeProgressRecord(progress), courseProgress });
}
