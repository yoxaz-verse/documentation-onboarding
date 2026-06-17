import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdminSession } from '../../../../lib/adminAuth';
import type { AdminOnboardingStepStatus, AdminOperatorRow } from '../../../../lib/adminTypes';
import { getCompletedMilestoneCount, normalizeProgressRecord } from '../../../../lib/onboarding';
import { JOURNEY_DAY_TEMPLATES } from '../../../../config/operatorJourney';
import { buildAdminJourneySnapshot } from '../../../../lib/adminJourneyAnalytics';
import { getJourneyCurrentDay, normalizeJourneyDayTemplates, type JourneyMilestoneRecord, type JourneySubmissionRecord, type JourneyTemplateRecord } from '../../../../lib/operatorJourney';
import { isMissingSupabaseTableError } from '../../../../lib/supabaseErrors';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

function toSafePage(value: string | string[] | undefined, fallback: number) {
  const parsed = Number(Array.isArray(value) ? value[0] : value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.floor(parsed);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = requireAdminSession(req, res);
  if (!session) return;

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const query = String(req.query.q || '').trim().toLowerCase();
  const stepFilter = Number(req.query.step || 0);
  const stepStateFilter = String(req.query.stepState || '').trim();
  const journeyDayFilter = Number(req.query.journeyDay || 0);
  const journeyStatusFilter = String(req.query.journeyStatus || '').trim();
  const submissionStatusFilter = String(req.query.submissionStatus || '').trim();
  const page = toSafePage(req.query.page, 1);
  const pageSize = Math.min(100, toSafePage(req.query.pageSize, 20));

  const [
    { data: operators, error: operatorsError },
    { data: profiles, error: profilesError },
    { data: progressRows, error: progressError },
    { data: submissions, error: submissionsError },
    { data: journeyRows, error: journeyError },
    { data: journeyMilestoneRows, error: journeyMilestoneError },
    { data: journeySubmissionRows, error: journeySubmissionError },
    { data: templateRows, error: templateError },
  ] = await Promise.all([
    supabaseAdmin.from('operators').select('email, name'),
    supabaseAdmin.from('operator_profiles').select('email, full_name'),
    supabaseAdmin
      .from('operator_progress')
      .select('email, current_step, updated_at'),
    supabaseAdmin.from('onboarding_submissions').select('email, status, completion_code, updated_at'),
    supabaseAdmin.from('operator_journey_state').select('email, started_at, updated_at'),
    supabaseAdmin.from('operator_journey_milestone_state').select('email, milestone_id, updated_at'),
    supabaseAdmin.from('operator_journey_day_submissions').select('email, template_id, day_number, status, submitted_at, reviewed_at, created_at, updated_at'),
    supabaseAdmin.from('operator_journey_day_templates').select('template_id, day_number, title, description, category, href, action_label, is_active, rich_template, review_required, button_text, completion_message'),
  ]);

  if (operatorsError) return res.status(500).json({ error: operatorsError.message });
  if (profilesError) return res.status(500).json({ error: profilesError.message });
  if (progressError) return res.status(500).json({ error: progressError.message });
  if (submissionsError) return res.status(500).json({ error: submissionsError.message });
  if (journeyError) return res.status(500).json({ error: journeyError.message });
  if (journeyMilestoneError) return res.status(500).json({ error: journeyMilestoneError.message });
  if (journeySubmissionError && !isMissingSupabaseTableError(journeySubmissionError)) return res.status(500).json({ error: journeySubmissionError.message });
  if (templateError && !isMissingSupabaseTableError(templateError)) return res.status(500).json({ error: templateError.message });

  const profileMap = new Map((profiles || []).map((profile) => [profile.email, profile]));
  const progressMap = new Map((progressRows || []).map((progress) => [progress.email, progress]));
  const submissionMap = new Map((submissions || []).map((submission) => [submission.email, submission]));
  const journeyMap = new Map((journeyRows || []).map((journey) => [journey.email, journey]));
  const journeyTemplates = templateError ? JOURNEY_DAY_TEMPLATES : normalizeJourneyDayTemplates((templateRows || []) as JourneyTemplateRecord[]);
  const journeyTotalMilestones = journeyTemplates.filter((milestone) => milestone.isActive !== false).length;
  const journeyMilestoneCounts = (journeyMilestoneRows || []).reduce<Record<string, { count: number; latestActivityAt: string | null; rows: Array<JourneyMilestoneRecord & { email: string; updated_at?: string | null }> }>>((acc, row) => {
    const current = acc[row.email] || { count: 0, latestActivityAt: null, rows: [] };
    current.count += 1;
    current.latestActivityAt = [current.latestActivityAt, row.updated_at].filter(Boolean).sort().reverse()[0] || null;
    current.rows.push(row as JourneyMilestoneRecord & { email: string; updated_at?: string | null });
    acc[row.email] = current;
    return acc;
  }, {});
  const journeySubmissionsByEmail = ((journeySubmissionError ? [] : journeySubmissionRows) || []).reduce<Record<string, JourneySubmissionRecord[]>>((acc, row) => {
    acc[row.email] = acc[row.email] || [];
    acc[row.email].push(row as JourneySubmissionRecord);
    return acc;
  }, {});

  const getStepStatus = (completedMilestones: number, currentStep: number): AdminOnboardingStepStatus => {
    if (stepFilter > 0) {
      if (completedMilestones >= stepFilter) return 'completed';
      if (currentStep === stepFilter) return 'current';
      return 'not_completed';
    }
    if (completedMilestones >= currentStep) return 'completed';
    return 'current';
  };

  const allRows: AdminOperatorRow[] = (operators || []).map((operator) => {
    const progress = normalizeProgressRecord(progressMap.get(operator.email));
    const submission = submissionMap.get(operator.email);
    const profile = profileMap.get(operator.email);
    const journey = journeyMap.get(operator.email);
    const journeyMilestones = journeyMilestoneCounts[operator.email] || { count: 0, latestActivityAt: null, rows: [] };
    const journeySubmissions = journeySubmissionsByEmail[operator.email] || [];
    const journeySnapshot = buildAdminJourneySnapshot({
      email: operator.email,
      startedAt: journey?.started_at || null,
      stateUpdatedAt: journey?.updated_at || null,
      milestones: journeyMilestones.rows,
      submissions: journeySubmissions,
      templates: journeyTemplates,
    });
    const completedMilestones = getCompletedMilestoneCount(progress);
    const currentStep = progress?.current_step || 1;

    const latestActivityAt = [progress?.updated_at, submission?.updated_at, journey?.updated_at, journeyMilestones.latestActivityAt, journeySnapshot.latestActivityAt].filter(Boolean).sort().reverse()[0] || null;

    return {
      email: operator.email,
      name: operator.name || null,
      profileName: profile?.full_name || null,
      currentStep,
      completedMilestones,
      journeyStartedAt: journey?.started_at || null,
      journeyCurrentDay: getJourneyCurrentDay(journey?.started_at || null),
      journeyTrackStatus: journeySnapshot.status,
      journeyActionDay: journeySnapshot.actionDay,
      journeyExpectedDay: journeySnapshot.expectedDay,
      journeyLastSubmissionAt: journeySnapshot.lastSubmissionAt,
      journeyPendingReviewCount: journeySnapshot.pendingReviewCount,
      journeyNeedsCorrectionCount: journeySnapshot.needsCorrectionCount,
      journeyCompletedMilestones: journeyMilestones.count,
      journeyTotalMilestones,
      onboardingStepStatus: getStepStatus(completedMilestones, currentStep),
      submissionStatus: submission?.status || 'pending',
      hasCompletionCode: Boolean(submission?.completion_code),
      latestActivityAt,
    };
  });

  const filteredRows = allRows
    .filter((row) => {
      if (!query) return true;
        const haystack = [row.email, row.name || '', row.profileName || ''].join(' ').toLowerCase();
        return haystack.includes(query);
    })
    .filter((row) => {
      if (stepFilter > 0 && stepStateFilter && row.onboardingStepStatus !== stepStateFilter) return false;
      if (stepFilter > 0 && !stepStateFilter) return row.currentStep === stepFilter || row.completedMilestones >= stepFilter;
      return true;
    })
    .filter((row) => (journeyDayFilter > 0 ? row.journeyActionDay === journeyDayFilter : true))
    .filter((row) => {
      if (!journeyStatusFilter) return true;
      if (journeyStatusFilter === 'started') return Boolean(row.journeyStartedAt);
      return row.journeyTrackStatus === journeyStatusFilter;
    })
    .filter((row) => (submissionStatusFilter ? row.submissionStatus === submissionStatusFilter : true));

  filteredRows.sort((a, b) => {
    const aTime = a.latestActivityAt ? new Date(a.latestActivityAt).getTime() : 0;
    const bTime = b.latestActivityAt ? new Date(b.latestActivityAt).getTime() : 0;
    if (bTime !== aTime) return bTime - aTime;
    return a.email.localeCompare(b.email);
  });

  const total = filteredRows.length;
  const start = (page - 1) * pageSize;
  const paged = filteredRows.slice(start, start + pageSize);

  return res.status(200).json({
    operators: paged,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  });
}
