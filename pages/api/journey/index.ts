import type { NextApiRequest, NextApiResponse } from 'next';
import { buildCourseProgressSummary } from '../../../lib/courseProgress';
import { ensureOperatorSeed } from '../../../lib/ensureOperatorSeed';
import { buildJourneySummary, normalizeJourneyDayTemplates, type JourneyCheckRecord, type JourneyMilestoneRecord, type JourneyStateRecord, type JourneySubmissionRecord, type JourneyTemplateRecord } from '../../../lib/operatorJourney';
import { areCoursesUnlocked, normalizeProgressRecord } from '../../../lib/onboarding';
import { requireSession } from '../../../lib/serverAuth';
import { isMissingSupabaseTableError } from '../../../lib/supabaseErrors';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import type { JourneyResponse } from '../../../lib/types';

type SubmoduleStateRow = {
  submodule_id: string;
  draft_answers: Record<string, string> | null;
  status: 'locked' | 'in_progress' | 'passed';
  updated_at: string;
};

function schemaError(res: NextApiResponse, table: string) {
  return res.status(500).json({
    error: `Database schema is not up to date. Apply the operator journey migration so ${table} is available.`,
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = requireSession(req, res);
  if (!session) return;

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const seedError = await ensureOperatorSeed(session.email);
  if (seedError) return res.status(500).json({ error: `Failed to ensure operator record: ${seedError}` });

  const { data: progressData, error: progressError } = await supabaseAdmin
    .from('operator_progress')
    .select('*')
    .eq('email', session.email)
    .maybeSingle();

  if (progressError) return res.status(500).json({ error: progressError.message });

  let progress = progressData;
  if (!progress) {
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('operator_progress')
      .insert({ email: session.email, current_step: 1 })
      .select('*')
      .single();

    if (insertError) return res.status(500).json({ error: insertError.message });
    progress = inserted;
  }

  const normalizedProgress = normalizeProgressRecord(progress)!;
  if (!areCoursesUnlocked(normalizedProgress)) {
    return res.status(403).json({ error: 'Complete Step 10 before opening the operator journey.' });
  }

  const [
    { data: passedRows, error: passedError },
    { data: submoduleRows, error: submoduleError },
    { data: journeyState, error: journeyStateError },
    { data: checkRows, error: checkError },
    { data: milestoneRows, error: milestoneError },
    { data: templateRows, error: templateError },
    { data: submissionRows, error: submissionError },
  ] = await Promise.all([
    supabaseAdmin.from('quiz_attempts').select('module_id').eq('email', session.email).eq('passed', true),
    supabaseAdmin
      .from('course_submodule_state')
      .select('submodule_id, draft_answers, status, updated_at')
      .eq('email', session.email)
      .order('updated_at', { ascending: false }),
    supabaseAdmin
      .from('operator_journey_state')
      .select('email, started_at, created_at, updated_at')
      .eq('email', session.email)
      .maybeSingle(),
    supabaseAdmin
      .from('operator_journey_check_state')
      .select('check_id, completed_at')
      .eq('email', session.email),
    supabaseAdmin
      .from('operator_journey_milestone_state')
      .select('milestone_id, completed_at')
      .eq('email', session.email),
    supabaseAdmin
      .from('operator_journey_day_templates')
      .select('template_id, day_number, title, description, category, href, action_label, is_active, rich_template, review_required, button_text, completion_message')
      .order('day_number', { ascending: true }),
    supabaseAdmin
      .from('operator_journey_day_submissions')
      .select('id, email, template_id, day_number, status, answers, computed_metrics, submitted_at, reviewed_at, reviewed_by, review_note, created_at, updated_at')
      .eq('email', session.email)
      .order('day_number', { ascending: true }),
  ]);

  if (passedError) return res.status(500).json({ error: passedError.message });
  if (submoduleError && !isMissingSupabaseTableError(submoduleError)) return res.status(500).json({ error: submoduleError.message });
  if (journeyStateError) {
    if (isMissingSupabaseTableError(journeyStateError)) return schemaError(res, 'operator_journey_state');
    return res.status(500).json({ error: journeyStateError.message });
  }
  if (checkError) {
    if (isMissingSupabaseTableError(checkError)) return schemaError(res, 'operator_journey_check_state');
    return res.status(500).json({ error: checkError.message });
  }
  if (milestoneError) {
    if (isMissingSupabaseTableError(milestoneError)) return schemaError(res, 'operator_journey_milestone_state');
    return res.status(500).json({ error: milestoneError.message });
  }
  if (templateError && !isMissingSupabaseTableError(templateError)) return res.status(500).json({ error: templateError.message });
  if (submissionError && !isMissingSupabaseTableError(submissionError)) return res.status(500).json({ error: submissionError.message });

  const rows = (submoduleRows || []) as SubmoduleStateRow[];
  const draftBySubModuleId = rows.reduce<Record<string, Record<string, string>>>((acc, row) => {
    acc[row.submodule_id] = row.draft_answers || {};
    return acc;
  }, {});
  const activeCandidate = rows.find((row) => row.status !== 'passed')?.submodule_id || null;
  const passedSubModuleIds = new Set((passedRows || []).map((row) => row.module_id));
  const courseProgress = buildCourseProgressSummary(passedSubModuleIds, draftBySubModuleId, activeCandidate);
  const templates = normalizeJourneyDayTemplates(templateError ? null : (templateRows || []) as JourneyTemplateRecord[]);
  const response: JourneyResponse = {
    progress: normalizedProgress,
    courseProgress,
    journey: buildJourneySummary(
      journeyState as JourneyStateRecord | null,
      (checkRows || []) as JourneyCheckRecord[],
      (milestoneRows || []) as JourneyMilestoneRecord[],
      templates,
      (submissionError ? [] : submissionRows || []) as JourneySubmissionRecord[]
    ),
  };

  return res.status(200).json(response);
}
