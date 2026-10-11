import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdminSession } from '../../../lib/adminAuth';
import type { AdminOverview } from '../../../lib/adminTypes';
import { buildAdminJourneyAnalytics, buildAdminJourneySnapshot } from '../../../lib/adminJourneyAnalytics';
import { JOURNEY_DAY_TEMPLATES } from '../../../config/operatorJourney';
import { normalizeJourneyDayTemplates, type JourneyMilestoneRecord, type JourneySubmissionRecord, type JourneyTemplateRecord } from '../../../lib/operatorJourney';
import { FINAL_MILESTONE, getCompletedMilestoneCount, MILESTONES, normalizeProgressRecord } from '../../../lib/onboarding';
import { isMissingSupabaseTableError } from '../../../lib/supabaseErrors';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { FUNNEL_EVENTS, FUNNEL_EVENT_LABELS, type FunnelEventName } from '../../../lib/funnel';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = requireAdminSession(req, res);
  if (!session) return;

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const requestedDays = Number(req.query.days || 30);
  const days = [7, 30, 90].includes(requestedDays) ? requestedDays : 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: operators, error: operatorsError },
    { data: progressData, error: progressError },
    { data: journeyRows, error: journeyError },
    { data: journeyMilestoneRows, error: journeyMilestoneError },
    { data: journeySubmissionRows, error: journeySubmissionError },
    { data: templateRows, error: templateError },
    { data: funnelRows, error: funnelError },
  ] = await Promise.all([
    supabaseAdmin.from('operators').select('email, invitation_status'),
    supabaseAdmin.from('operator_progress').select('email, current_step, step1_completed, step2_completed, step3_completed, step4_completed, updated_at'),
    supabaseAdmin.from('operator_journey_state').select('email, started_at, updated_at'),
    supabaseAdmin.from('operator_journey_milestone_state').select('email, milestone_id, completed_at, updated_at'),
    supabaseAdmin.from('operator_journey_day_submissions').select('email, template_id, day_number, status, submitted_at, reviewed_at, created_at, updated_at'),
    supabaseAdmin.from('operator_journey_day_templates').select('template_id, day_number, title, description, category, href, action_label, is_active, rich_template, review_required, button_text, completion_message'),
    supabaseAdmin.from('operator_funnel_events').select('event_name, visitor_id, email').gte('created_at', since),
  ]);

  if (operatorsError) return res.status(500).json({ error: operatorsError.message });
  if (progressError) return res.status(500).json({ error: progressError.message });
  if (journeyError && !isMissingSupabaseTableError(journeyError)) return res.status(500).json({ error: journeyError.message });
  if (journeyMilestoneError && !isMissingSupabaseTableError(journeyMilestoneError)) return res.status(500).json({ error: journeyMilestoneError.message });
  if (journeySubmissionError && !isMissingSupabaseTableError(journeySubmissionError)) return res.status(500).json({ error: journeySubmissionError.message });
  if (templateError && !isMissingSupabaseTableError(templateError)) return res.status(500).json({ error: templateError.message });
  if (funnelError && !isMissingSupabaseTableError(funnelError)) return res.status(500).json({ error: funnelError.message });

  const progressMap = new Map((progressData || []).map((row) => [row.email, row]));
  const journeyMap = new Map((journeyRows || []).map((row) => [row.email, row]));
  const milestonesByEmail = ((journeyMilestoneError ? [] : journeyMilestoneRows) || []).reduce<Record<string, Array<JourneyMilestoneRecord & { email: string; updated_at?: string | null }>>>((acc, row) => {
    acc[row.email] = acc[row.email] || [];
    acc[row.email].push(row as JourneyMilestoneRecord & { email: string; updated_at?: string | null });
    return acc;
  }, {});
  const submissionsByEmail = ((journeySubmissionError ? [] : journeySubmissionRows) || []).reduce<Record<string, JourneySubmissionRecord[]>>((acc, row) => {
    acc[row.email] = acc[row.email] || [];
    acc[row.email].push(row as JourneySubmissionRecord);
    return acc;
  }, {});
  const journeyTemplates = templateError ? JOURNEY_DAY_TEMPLATES : normalizeJourneyDayTemplates((templateRows || []) as JourneyTemplateRecord[]);

  const rows = (operators || []).map((operator) => normalizeProgressRecord(progressMap.get(operator.email))).filter(Boolean);
  const totalOperators = (operators || []).length;
  const stepCompletion = MILESTONES.map((milestone) => ({
    step: milestone.number,
    label: milestone.label,
    count: rows.filter((row) => getCompletedMilestoneCount(row) >= milestone.number).length,
  }));
  const completedOperators = rows.filter((row) => getCompletedMilestoneCount(row) >= FINAL_MILESTONE).length;
  const inProgressOperators = Math.max(totalOperators - completedOperators, 0);
  const completionRate = totalOperators > 0 ? Math.round((completedOperators / totalOperators) * 100) : 0;
  const journeySnapshots = (operators || []).map((operator) => {
    const journey = journeyMap.get(operator.email);
    return buildAdminJourneySnapshot({
      email: operator.email,
      startedAt: journey?.started_at || null,
      stateUpdatedAt: journey?.updated_at || null,
      milestones: milestonesByEmail[operator.email] || [],
      submissions: submissionsByEmail[operator.email] || [],
      templates: journeyTemplates,
    });
  });
  const accessCounts = (operators || []).reduce<Record<'invited' | 'active' | 'disabled', number>>((counts, operator) => {
    const status = (operator.invitation_status || 'invited') as 'invited' | 'active' | 'disabled';
    counts[status] += 1;
    return counts;
  }, { invited: 0, active: 0, disabled: 0 });
  const funnelStages = FUNNEL_EVENTS.map((event, index) => {
    const identities = new Set(
      (funnelRows || [])
        .filter((row) => row.event_name === event)
        .map((row) => row.email || row.visitor_id)
        .filter(Boolean)
    );
    const previousEvent = FUNNEL_EVENTS[index - 1];
    const previousCount = previousEvent
      ? new Set((funnelRows || []).filter((row) => row.event_name === previousEvent).map((row) => row.email || row.visitor_id).filter(Boolean)).size
      : 0;
    return {
      event,
      label: FUNNEL_EVENT_LABELS[event as FunnelEventName],
      count: identities.size,
      conversionFromPrevious: index === 0 ? null : previousCount > 0 ? Math.round((identities.size / previousCount) * 100) : 0,
    };
  });

  const overview: AdminOverview = {
    totalOperators,
    completedOperators,
    inProgressOperators,
    completionRate,
    accessCounts,
    funnel: { days, stages: funnelStages },
    stepCompletion,
    journey: buildAdminJourneyAnalytics(journeySnapshots, journeyTemplates.length || 30),
  };

  return res.status(200).json({ overview });
}
