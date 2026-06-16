import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdminSession } from '../../../../lib/adminAuth';
import type { AdminOperatorDetail } from '../../../../lib/adminTypes';
import { buildJourneySummary, normalizeJourneyTemplates, type JourneyCheckRecord, type JourneyMilestoneRecord, type JourneyStateRecord, type JourneyTemplateRecord } from '../../../../lib/operatorJourney';
import { getCompletedMilestoneCount, getMilestone, MILESTONES, normalizeProgressRecord } from '../../../../lib/onboarding';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { isMissingSupabaseTableError } from '../../../../lib/supabaseErrors';

function formatFieldValue(value: string | null | undefined) {
  const normalized = String(value || '').trim();
  return normalized || 'Not provided';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = requireAdminSession(req, res);
  if (!session) return;

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const email = String(req.query.email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid operator email is required.' });
  }

  const [
    { data: operator, error: operatorError },
    { data: profile, error: profileError },
    { data: progress, error: progressError },
    { data: submission, error: submissionError },
    { data: quizRows, error: quizError },
    { data: journeyState, error: journeyStateError },
    { data: journeyChecks, error: journeyChecksError },
    { data: journeyMilestones, error: journeyMilestonesError },
    { data: templateRows, error: templateError },
  ] = await Promise.all([
    supabaseAdmin
      .from('operators')
      .select('email, name, phone, role, company, timezone, created_at, updated_at')
      .eq('email', email)
      .maybeSingle(),
    supabaseAdmin
      .from('operator_profiles')
      .select('full_name, phone, role_title, city, state, years_experience, total_work_experience_years, group_trading_experience_years, preferred_language, official_company_email, motivation, operator_background, profile_photo_url, zoho_acknowledged_at, zoho_contact_revealed_at, zoho_support_stage, created_at, updated_at')
      .eq('email', email)
      .maybeSingle(),
    supabaseAdmin
      .from('operator_progress')
      .select('current_step, created_at, updated_at')
      .eq('email', email)
      .maybeSingle(),
    supabaseAdmin
      .from('onboarding_submissions')
      .select('status, completion_code, submitted_at, created_at, updated_at')
      .eq('email', email)
      .maybeSingle(),
    supabaseAdmin
      .from('quiz_performance')
      .select('module_id, best_score, attempts, ever_passed, last_attempt_at')
      .eq('email', email),
    supabaseAdmin
      .from('operator_journey_state')
      .select('email, started_at, created_at, updated_at')
      .eq('email', email)
      .maybeSingle(),
    supabaseAdmin
      .from('operator_journey_check_state')
      .select('check_id, completed_at, updated_at')
      .eq('email', email),
    supabaseAdmin
      .from('operator_journey_milestone_state')
      .select('milestone_id, completed_at, updated_at')
      .eq('email', email),
    supabaseAdmin
      .from('operator_journey_day_templates')
      .select('template_id, day_number, title, description, category, href, action_label, is_active'),
  ]);

  if (operatorError) return res.status(500).json({ error: operatorError.message });
  if (profileError) return res.status(500).json({ error: profileError.message });
  if (progressError) return res.status(500).json({ error: progressError.message });
  if (submissionError) return res.status(500).json({ error: submissionError.message });
  if (quizError) return res.status(500).json({ error: quizError.message });
  if (journeyStateError) return res.status(500).json({ error: journeyStateError.message });
  if (journeyChecksError) return res.status(500).json({ error: journeyChecksError.message });
  if (journeyMilestonesError) return res.status(500).json({ error: journeyMilestonesError.message });
  if (templateError && !isMissingSupabaseTableError(templateError)) return res.status(500).json({ error: templateError.message });

  if (!operator) return res.status(404).json({ error: 'Operator not found.' });

  const normalizedProgress = normalizeProgressRecord(progress);
  const completedMilestones = getCompletedMilestoneCount(progress);
  const currentStep = normalizedProgress?.current_step || 1;
  const latestActivityAt =
    [normalizedProgress?.updated_at, profile?.updated_at, submission?.updated_at, journeyState?.updated_at]
      .filter(Boolean)
      .sort()
      .reverse()[0] || null;
  const journeySummary = buildJourneySummary(
    journeyState as JourneyStateRecord | null,
    (journeyChecks || []) as JourneyCheckRecord[],
    (journeyMilestones || []) as JourneyMilestoneRecord[],
    normalizeJourneyTemplates(templateError ? null : (templateRows || []) as JourneyTemplateRecord[])
  );
  const journeyLatestActivityAt =
    [
      journeyState?.updated_at,
      ...(journeyChecks || []).map((row) => row.updated_at),
      ...(journeyMilestones || []).map((row) => row.updated_at),
    ]
      .filter(Boolean)
      .sort()
      .reverse()[0] || null;

  const stepSections: AdminOperatorDetail['stepSections'] = MILESTONES.map((milestone) => {
    const status =
      completedMilestones >= milestone.number
        ? 'complete'
        : currentStep === milestone.number
          ? 'current'
          : 'upcoming';

    const fields: AdminOperatorDetail['stepSections'][number]['fields'] = [];
    let note = 'This step records milestone progress in the onboarding flow.';

    if (milestone.number === 3) {
      note = 'Individual expectation acknowledgements are not persisted in the current system.';
    }

    if (milestone.number === 6) {
      note = profile
        ? 'Profile details captured during the experience and motivation step.'
        : 'No experience and motivation details have been submitted yet.';
      fields.push(
        { label: 'Full name', value: formatFieldValue(profile?.full_name) },
        { label: 'Phone', value: formatFieldValue(profile?.phone) },
        { label: 'City', value: formatFieldValue(profile?.city) },
        { label: 'State', value: formatFieldValue(profile?.state) },
        { label: 'Preferred language', value: formatFieldValue(profile?.preferred_language) },
        { label: 'Total work experience', value: formatFieldValue(profile?.total_work_experience_years) },
        { label: 'Agro-trade experience', value: formatFieldValue(profile?.group_trading_experience_years) },
        { label: 'Background', value: formatFieldValue(profile?.operator_background) },
        { label: 'Motivation', value: formatFieldValue(profile?.motivation) }
      );
    }

    if (milestone.number === 8) {
      note = profile?.official_company_email
        ? 'Official communication email saved for operator communication.'
        : 'The official email has not been saved yet.';
      fields.push({
        label: 'Official company email',
        value: formatFieldValue(profile?.official_company_email),
      });
    }

    if (milestone.number === 10) {
      note = profile?.zoho_acknowledged_at
        ? 'Zoho completion was acknowledged and support escalation timing is available below.'
        : 'Zoho completion has not been acknowledged yet.';
      fields.push(
        { label: 'Acknowledged at', value: formatFieldValue(profile?.zoho_acknowledged_at) },
        { label: 'Support stage', value: formatFieldValue(profile?.zoho_support_stage) },
        { label: 'Support contact revealed', value: formatFieldValue(profile?.zoho_contact_revealed_at) }
      );
    }

    return {
      step: milestone.number,
      label: milestone.label,
      shortLabel: milestone.shortLabel,
      summary: milestone.summary,
      status,
      statusLabel: status === 'complete' ? 'Complete' : status === 'current' ? 'Current step' : 'Upcoming',
      note,
      fields,
    };
  });

  const detail: AdminOperatorDetail = {
    operator: {
      email: operator.email,
      name: operator.name || null,
      phone: operator.phone || null,
      role: operator.role || null,
      company: operator.company || null,
      timezone: operator.timezone || null,
      createdAt: operator.created_at || null,
      updatedAt: operator.updated_at || null,
    },
    summary: {
      displayName: operator.name || profile?.full_name || operator.email,
      latestActivityAt,
      currentStepLabel: getMilestone(Math.min(currentStep, MILESTONES.length))?.label || 'Step 1',
      progressState: completedMilestones >= MILESTONES.length ? 'completed' : completedMilestones > 0 ? 'in_progress' : 'not_started',
      submissionState: submission?.status === 'completed' ? 'completed' : submission ? 'pending' : 'missing',
    },
    profile: profile
      ? {
          fullName: profile.full_name,
          phone: profile.phone,
          roleTitle: profile.role_title,
          city: profile.city,
          state: profile.state,
          yearsExperience: profile.years_experience,
          totalWorkExperienceYears: profile.total_work_experience_years || '',
          agroTradeExperienceYears: profile.group_trading_experience_years || '',
          preferredLanguage: profile.preferred_language,
          officialCompanyEmail: profile.official_company_email || '',
          motivation: profile.motivation || '',
          operatorBackground: profile.operator_background || '',
          profilePhotoUrl: profile.profile_photo_url,
          createdAt: profile.created_at || null,
          updatedAt: profile.updated_at || null,
        }
      : null,
    progress: progress
      ? {
          currentStep,
          completedMilestones,
          createdAt: progress.created_at || null,
          updatedAt: progress.updated_at || null,
          milestones: MILESTONES.map((milestone) => ({
            step: milestone.number,
            label: milestone.label,
            completed: completedMilestones >= milestone.number,
          })),
        }
      : null,
    journey: {
      startedAt: journeySummary.startedAt,
      currentDay: journeySummary.currentDay,
      completedMilestones: journeySummary.completedMilestoneCount,
      totalMilestones: journeySummary.totalMilestoneCount,
      completedChecks: journeySummary.completedCheckCount,
      totalChecks: journeySummary.totalCheckCount,
      latestActivityAt: journeyLatestActivityAt,
    },
    stepSections,
    submission: submission
      ? {
          status: submission.status,
          completionCode: submission.completion_code || null,
          submittedAt: submission.submitted_at || null,
          createdAt: submission.created_at || null,
          updatedAt: submission.updated_at || null,
        }
      : null,
    quizSummary: (quizRows || [])
      .map((row) => ({
        moduleId: row.module_id,
        bestScore: row.best_score,
        attempts: row.attempts,
        everPassed: row.ever_passed,
        lastAttemptAt: row.last_attempt_at || null,
      }))
      .sort((a, b) => a.moduleId.localeCompare(b.moduleId)),
  };

  return res.status(200).json({ detail });
}
