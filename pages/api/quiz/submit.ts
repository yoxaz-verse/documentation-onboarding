import type { NextApiRequest, NextApiResponse } from 'next';
import { areAllCoursesPassed } from '../../../lib/courseProgress';
import { ensureOperatorSeed } from '../../../lib/ensureOperatorSeed';
import { requireSession } from '../../../lib/serverAuth';
import { isMissingSupabaseTableError } from '../../../lib/supabaseErrors';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { getSubModuleById, isSubModuleUnlocked } from '../../../config/courses';

type ActionType = 'save_draft' | 'submit_quiz';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = requireSession(req, res);
  if (!session) return;

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const seedError = await ensureOperatorSeed(session.email);
  if (seedError) return res.status(500).json({ error: `Failed to ensure operator record: ${seedError}` });

  const { action = 'submit_quiz', subModuleId, moduleId, score, passed, answers } = req.body || {};
  const resolvedSubModuleId = String(subModuleId || moduleId || '');

  if (!resolvedSubModuleId) return res.status(400).json({ error: 'Missing submodule identifier.' });

  const subModule = getSubModuleById(resolvedSubModuleId);
  if (!subModule) return res.status(400).json({ error: 'Unknown course sub-module.' });

  const { data: passedRows, error: passedError } = await supabaseAdmin
    .from('quiz_attempts')
    .select('module_id')
    .eq('email', session.email)
    .eq('passed', true);

  if (passedError) return res.status(500).json({ error: passedError.message });

  const passedSubModuleIds = new Set((passedRows || []).map((row) => row.module_id));
  const alreadyPassed = passedSubModuleIds.has(subModule.id);

  if (!isSubModuleUnlocked(subModule.id, passedSubModuleIds) && !alreadyPassed) {
    return res.status(403).json({ error: 'This lesson is locked. Complete the previous lesson in this course first.' });
  }

  const normalizedAnswers = typeof answers === 'object' && answers ? answers : {};

  if ((action as ActionType) === 'save_draft') {
    const { error: saveError } = await supabaseAdmin.from('course_submodule_state').upsert(
      {
        email: session.email,
        submodule_id: subModule.id,
        status: alreadyPassed ? 'passed' : 'in_progress',
        draft_answers: normalizedAnswers,
        started_at: new Date().toISOString(),
      },
      { onConflict: 'email,submodule_id' }
    );

    if (saveError && !isMissingSupabaseTableError(saveError)) {
      return res.status(500).json({ error: saveError.message });
    }

    return res.status(200).json({ ok: true, saved: true });
  }

  if (typeof score !== 'number' || typeof passed !== 'boolean') {
    return res.status(400).json({ error: 'Invalid quiz payload.' });
  }

  const { data: existingAttempts, error: attemptsError } = await supabaseAdmin
    .from('quiz_attempts')
    .select('attempt_number')
    .eq('email', session.email)
    .eq('module_id', subModule.id)
    .order('attempt_number', { ascending: false })
    .limit(1);

  if (attemptsError) return res.status(500).json({ error: attemptsError.message });

  const attemptNumber = existingAttempts?.length ? existingAttempts[0].attempt_number + 1 : 1;

  const { error } = await supabaseAdmin.from('quiz_attempts').insert({
    email: session.email,
    module_id: subModule.id,
    score,
    passed,
    attempt_number: attemptNumber,
    answers: normalizedAnswers,
  });

  if (error) return res.status(500).json({ error: error.message });

  const { error: stateError } = await supabaseAdmin.from('course_submodule_state').upsert(
    {
      email: session.email,
      submodule_id: subModule.id,
      status: passed ? 'passed' : 'in_progress',
      draft_answers: normalizedAnswers,
      started_at: new Date().toISOString(),
      completed_at: passed ? new Date().toISOString() : null,
    },
    { onConflict: 'email,submodule_id' }
  );

  if (stateError && !isMissingSupabaseTableError(stateError)) {
    return res.status(500).json({ error: stateError.message });
  }

  if (passed) {
    passedSubModuleIds.add(subModule.id);
    const allPassed = areAllCoursesPassed(passedSubModuleIds);
    return res.status(200).json({ attemptNumber, passed, allCoursesPassed: allPassed });
  }

  return res.status(200).json({ attemptNumber, passed, allCoursesPassed: false });
}
