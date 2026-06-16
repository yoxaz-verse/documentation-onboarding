import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdminSession } from '../../../../lib/adminAuth';
import type { AdminOperatorRow } from '../../../../lib/adminTypes';
import { getCompletedMilestoneCount, normalizeProgressRecord } from '../../../../lib/onboarding';
import { JOURNEY_MILESTONES } from '../../../../config/operatorJourney';
import { getJourneyCurrentDay, normalizeJourneyTemplates, type JourneyTemplateRecord } from '../../../../lib/operatorJourney';
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
  const page = toSafePage(req.query.page, 1);
  const pageSize = Math.min(100, toSafePage(req.query.pageSize, 20));

  const [
    { data: operators, error: operatorsError },
    { data: profiles, error: profilesError },
    { data: progressRows, error: progressError },
    { data: submissions, error: submissionsError },
    { data: journeyRows, error: journeyError },
    { data: journeyMilestoneRows, error: journeyMilestoneError },
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
    supabaseAdmin.from('operator_journey_day_templates').select('template_id, day_number, title, description, category, href, action_label, is_active'),
  ]);

  if (operatorsError) return res.status(500).json({ error: operatorsError.message });
  if (profilesError) return res.status(500).json({ error: profilesError.message });
  if (progressError) return res.status(500).json({ error: progressError.message });
  if (submissionsError) return res.status(500).json({ error: submissionsError.message });
  if (journeyError) return res.status(500).json({ error: journeyError.message });
  if (journeyMilestoneError) return res.status(500).json({ error: journeyMilestoneError.message });
  if (templateError && !isMissingSupabaseTableError(templateError)) return res.status(500).json({ error: templateError.message });

  const profileMap = new Map((profiles || []).map((profile) => [profile.email, profile]));
  const progressMap = new Map((progressRows || []).map((progress) => [progress.email, progress]));
  const submissionMap = new Map((submissions || []).map((submission) => [submission.email, submission]));
  const journeyMap = new Map((journeyRows || []).map((journey) => [journey.email, journey]));
  const journeyTemplates = templateError ? JOURNEY_MILESTONES : normalizeJourneyTemplates((templateRows || []) as JourneyTemplateRecord[]);
  const journeyTotalMilestones = journeyTemplates.filter((milestone) => milestone.isActive !== false).length;
  const journeyMilestoneCounts = (journeyMilestoneRows || []).reduce<Record<string, { count: number; latestActivityAt: string | null }>>((acc, row) => {
    const current = acc[row.email] || { count: 0, latestActivityAt: null };
    current.count += 1;
    current.latestActivityAt = [current.latestActivityAt, row.updated_at].filter(Boolean).sort().reverse()[0] || null;
    acc[row.email] = current;
    return acc;
  }, {});

  const allRows: AdminOperatorRow[] = (operators || []).map((operator) => {
    const progress = normalizeProgressRecord(progressMap.get(operator.email));
    const submission = submissionMap.get(operator.email);
    const profile = profileMap.get(operator.email);
    const journey = journeyMap.get(operator.email);
    const journeyMilestones = journeyMilestoneCounts[operator.email] || { count: 0, latestActivityAt: null };

    const latestActivityAt = [progress?.updated_at, submission?.updated_at, journey?.updated_at, journeyMilestones.latestActivityAt].filter(Boolean).sort().reverse()[0] || null;

    return {
      email: operator.email,
      name: operator.name || null,
      profileName: profile?.full_name || null,
      currentStep: progress?.current_step || 1,
      completedMilestones: getCompletedMilestoneCount(progress),
      journeyStartedAt: journey?.started_at || null,
      journeyCurrentDay: getJourneyCurrentDay(journey?.started_at || null),
      journeyCompletedMilestones: journeyMilestones.count,
      journeyTotalMilestones,
      submissionStatus: submission?.status || 'pending',
      hasCompletionCode: Boolean(submission?.completion_code),
      latestActivityAt,
    };
  });

  const filteredRows = query
    ? allRows.filter((row) => {
        const haystack = [row.email, row.name || '', row.profileName || ''].join(' ').toLowerCase();
        return haystack.includes(query);
      })
    : allRows;

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
