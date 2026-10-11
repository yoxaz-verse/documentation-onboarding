import { buildCourseProgressSummary } from './courseProgress';
import { normalizeProgressRecord } from './onboarding';
import { isMissingSupabaseTableError } from './supabaseErrors';
import { supabaseAdmin } from './supabaseAdmin';
import type { ProgressResponse } from './types';

type SubmoduleStateRow = {
  submodule_id: string;
  draft_answers: Record<string, string> | null;
  status: 'locked' | 'in_progress' | 'passed';
  updated_at: string;
};

export async function getProgressBundleForEmail(email: string): Promise<ProgressResponse> {
  const normalizedEmail = email.trim().toLowerCase();
  const { data: existingProgress, error: progressError } = await supabaseAdmin
    .from('operator_progress')
    .select('*')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (progressError) throw new Error(progressError.message);

  let progress = existingProgress;
  if (!progress) {
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('operator_progress')
      .insert({ email: normalizedEmail, current_step: 1 })
      .select('*')
      .single();
    if (insertError) throw new Error(insertError.message);
    progress = inserted;
  }

  const [{ data: passedRows, error: passedError }, { data: submoduleRows, error: submoduleError }] = await Promise.all([
    supabaseAdmin.from('quiz_attempts').select('module_id').eq('email', normalizedEmail).eq('passed', true),
    supabaseAdmin
      .from('course_submodule_state')
      .select('submodule_id, draft_answers, status, updated_at')
      .eq('email', normalizedEmail)
      .order('updated_at', { ascending: false }),
  ]);

  if (passedError) throw new Error(passedError.message);
  if (submoduleError && !isMissingSupabaseTableError(submoduleError)) throw new Error(submoduleError.message);

  const rows = (submoduleRows || []) as SubmoduleStateRow[];
  const draftBySubModuleId = rows.reduce<Record<string, Record<string, string>>>((acc, row) => {
    acc[row.submodule_id] = row.draft_answers || {};
    return acc;
  }, {});
  const activeCandidate = rows.find((row) => row.status !== 'passed')?.submodule_id || null;
  const passedSubModuleIds = new Set((passedRows || []).map((row) => row.module_id));

  return {
    progress: normalizeProgressRecord(progress),
    courseProgress: buildCourseProgressSummary(passedSubModuleIds, draftBySubModuleId, activeCandidate),
  };
}
