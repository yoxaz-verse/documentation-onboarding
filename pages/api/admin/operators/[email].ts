import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdminSession } from '../../../../lib/adminAuth';
import type { AdminOperatorDetail } from '../../../../lib/adminTypes';
import { getAllCourses } from '../../../../config/courses';
import { buildJourneySummary, normalizeJourneyDayTemplates, type JourneyCheckRecord, type JourneyMilestoneRecord, type JourneyStateRecord, type JourneySubmissionRecord, type JourneyTemplateRecord } from '../../../../lib/operatorJourney';
import { getCompletedMilestoneCount, getMilestone, MILESTONES, normalizeProgressRecord } from '../../../../lib/onboarding';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { isMissingSupabaseTableError } from '../../../../lib/supabaseErrors';

function formatFieldValue(value: string | null | undefined) {
  const normalized = String(value || '').trim();
  return normalized || 'Not provided';
}

function normalizeOptionalValue(value: string | null | undefined) {
  const normalized = String(value || '').trim();
  return normalized || null;
}

function latestTimestamp(...values: Array<string | null | undefined>) {
  return values
    .filter((value): value is string => Boolean(value))
    .sort()
    .reverse()[0] || null;
}

function humanizeKey(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/^./, (character) => character.toUpperCase());
}

function displayFields(
  answers: Record<string, unknown> | null | undefined,
  labels: Map<string, string>
) {
  return Object.entries(answers || {}).map(([key, value]) => ({
    label: labels.get(key) || humanizeKey(key),
    value,
  }));
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
    { data: attemptRows, error: attemptsError },
    { data: submoduleStateRows, error: submoduleStateError },
    { data: journeySubmissionRows, error: journeySubmissionsError },
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
      .select('template_id, day_number, title, description, category, href, action_label, is_active, rich_template, review_required, button_text, completion_message')
      .order('day_number', { ascending: true }),
    supabaseAdmin
      .from('quiz_attempts')
      .select('module_id, score, passed, attempt_number, answers, submitted_at')
      .eq('email', email)
      .order('submitted_at', { ascending: true }),
    supabaseAdmin
      .from('course_submodule_state')
      .select('submodule_id, status, started_at, completed_at, updated_at')
      .eq('email', email),
    supabaseAdmin
      .from('operator_journey_day_submissions')
      .select('id, email, template_id, day_number, status, answers, computed_metrics, submitted_at, reviewed_at, reviewed_by, review_note, created_at, updated_at')
      .eq('email', email)
      .order('day_number', { ascending: true }),
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
  if (attemptsError) return res.status(500).json({ error: attemptsError.message });
  if (submoduleStateError && !isMissingSupabaseTableError(submoduleStateError)) return res.status(500).json({ error: submoduleStateError.message });
  if (journeySubmissionsError && !isMissingSupabaseTableError(journeySubmissionsError)) return res.status(500).json({ error: journeySubmissionsError.message });

  if (!operator) return res.status(404).json({ error: 'Operator not found.' });

  const normalizedProgress = normalizeProgressRecord(progress);
  const completedMilestones = getCompletedMilestoneCount(progress);
  const currentStep = normalizedProgress?.current_step || 1;
  const profileName = normalizeOptionalValue(profile?.full_name);
  const profilePhone = normalizeOptionalValue(profile?.phone);
  const profileRole = normalizeOptionalValue(profile?.role_title);
  const city = normalizeOptionalValue(profile?.city);
  const state = normalizeOptionalValue(profile?.state);
  const location = [city, state].filter(Boolean).join(', ') || null;
  const journeyTemplates = normalizeJourneyDayTemplates(templateError ? null : (templateRows || []) as JourneyTemplateRecord[]);
  const journeySubmissions = (journeySubmissionsError ? [] : journeySubmissionRows || []) as JourneySubmissionRecord[];
  const journeySummary = buildJourneySummary(
    journeyState as JourneyStateRecord | null,
    (journeyChecks || []) as JourneyCheckRecord[],
    (journeyMilestones || []) as JourneyMilestoneRecord[],
    journeyTemplates,
    journeySubmissions
  );
  const journeyLatestActivityAt =
    [
      journeyState?.updated_at,
      ...(journeyChecks || []).map((row) => row.updated_at),
      ...(journeyMilestones || []).map((row) => row.updated_at),
      ...journeySubmissions.map((row) => row.updated_at || row.submitted_at),
    ]
      .filter(Boolean)
      .sort()
      .reverse()[0] || null;

  const latestActivityAt = latestTimestamp(
    normalizedProgress?.updated_at,
    profile?.updated_at,
    operator.updated_at,
    submission?.updated_at,
    journeyState?.updated_at,
    journeyLatestActivityAt,
    ...(attemptRows || []).map((row) => row.submitted_at),
    ...(submoduleStateRows || []).map((row) => row.updated_at)
  );

  const stateByLesson = new Map((submoduleStateRows || []).map((row) => [row.submodule_id, row]));
  const attemptsByLesson = new Map<string, typeof attemptRows>();
  for (const row of attemptRows || []) {
    attemptsByLesson.set(row.module_id, [...(attemptsByLesson.get(row.module_id) || []), row]);
  }

  const courses: AdminOperatorDetail['courses'] = getAllCourses().map((course) => {
    const lessons: AdminOperatorDetail['courses'][number]['lessons'] = [...course.subModules].sort((a, b) => a.order - b.order).map((lesson) => {
      const state = stateByLesson.get(lesson.id);
      const attempts = attemptsByLesson.get(lesson.id) || [];
      const passed = state?.status === 'passed' || attempts.some((attempt) => attempt.passed);
      const status: AdminOperatorDetail['courses'][number]['lessons'][number]['status'] = passed ? 'passed' : state || attempts.length ? 'in_progress' : 'not_started';
      return {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        order: lesson.order,
        passScore: lesson.passScore,
        totalQuestions: lesson.questions.length,
        status,
        startedAt: state?.started_at || attempts[0]?.submitted_at || null,
        completedAt: state?.completed_at || [...attempts].reverse().find((attempt) => attempt.passed)?.submitted_at || null,
        attempts: attempts.map((attempt) => ({
          attemptNumber: attempt.attempt_number,
          score: attempt.score,
          passed: attempt.passed,
          createdAt: attempt.submitted_at || null,
          answers: lesson.questions.map((question) => {
            const answer = attempt.answers && typeof attempt.answers === 'object' ? String(attempt.answers[question.id] || '') || null : null;
            return {
              questionId: question.id,
              question: question.question,
              answer,
              correctAnswer: question.correctAnswer,
              correct: answer === question.correctAnswer,
            };
          }),
        })),
      };
    });
    const completedLessons = lessons.filter((lesson) => lesson.status === 'passed').length;
    return {
      id: course.id,
      title: course.title,
      description: course.description,
      divisionLabel: course.divisionLabel,
      status: completedLessons === lessons.length && lessons.length ? 'completed' : lessons.some((lesson) => lesson.status !== 'not_started') ? 'in_progress' : 'not_started',
      completedLessons,
      totalLessons: lessons.length,
      percentComplete: lessons.length ? Math.round((completedLessons / lessons.length) * 100) : 0,
      lessons,
    };
  });

  const journeyDays: AdminOperatorDetail['journey']['days'] = journeySummary.dayStatuses.map((dayStatus) => {
    const template = journeyTemplates.find((item) => item.id === dayStatus.templateId || item.day === dayStatus.day)!;
    const submissionRecord = dayStatus.submission;
    const labels = new Map<string, string>();
    for (const field of template.formFields || []) labels.set(field.id, field.label);
    for (const group of template.repeatGroups || []) {
      labels.set(group.id, group.label);
      for (const field of group.fields) labels.set(field.id, field.label);
    }
    for (const scenario of template.scenarioQuestions || []) labels.set(scenario.id, scenario.title);
    return {
      day: dayStatus.day,
      templateId: dayStatus.templateId,
      title: template.title,
      description: template.description,
      category: template.category,
      requiredOutput: template.requiredOutput || '',
      href: template.href || null,
      actionLabel: template.actionLabel || null,
      status: dayStatus.status,
      fields: displayFields(submissionRecord?.answers, labels),
      computedMetrics: displayFields(submissionRecord?.computed_metrics, new Map()),
      submittedAt: submissionRecord?.submitted_at || null,
      reviewedAt: submissionRecord?.reviewed_at || null,
      reviewedBy: submissionRecord?.reviewed_by || null,
      reviewNote: submissionRecord?.review_note || null,
      submissionId: submissionRecord?.id || null,
    };
  });

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

    if (milestone.number === 7) {
      note = status === 'complete'
        ? 'The operator confirmed joining the official WhatsApp group.'
        : 'WhatsApp group membership has not been confirmed yet.';
    }

    if (milestone.number === 9) {
      note = status === 'complete'
        ? 'The operator completed the WhatsApp group orientation.'
        : 'The WhatsApp group orientation has not been completed yet.';
    }

    if (milestone.number === 10) {
      note = status === 'complete'
        ? 'The operator confirmed WhatsApp communication readiness.'
        : 'WhatsApp communication readiness has not been confirmed yet.';
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
    record: {
      name: profileName || normalizeOptionalValue(operator.name),
      phone: profilePhone || normalizeOptionalValue(operator.phone),
      role: profileRole || normalizeOptionalValue(operator.role),
      location,
      preferredLanguage: normalizeOptionalValue(profile?.preferred_language),
      updatedAt: latestTimestamp(profile?.updated_at, operator.updated_at),
    },
    summary: {
      displayName: profileName || normalizeOptionalValue(operator.name) || operator.email,
      latestActivityAt,
      currentStepLabel: getMilestone(Math.min(currentStep, MILESTONES.length))?.label || 'Step 1',
      progressState: completedMilestones >= MILESTONES.length ? 'completed' : completedMilestones > 0 ? 'in_progress' : 'not_started',
      submissionState: submission?.status === 'completed' ? 'completed' : submission ? 'pending' : 'missing',
      totalOnboardingSteps: MILESTONES.length,
      totalCourses: courses.length,
      completedCourses: courses.filter((course) => course.status === 'completed').length,
      totalLessons: courses.reduce((total, course) => total + course.totalLessons, 0),
      completedLessons: courses.reduce((total, course) => total + course.completedLessons, 0),
      totalJourneyDays: journeyDays.length,
      completedJourneyDays: journeyDays.filter((day) => day.status === 'completed').length,
      pendingJourneyReviews: journeyDays.filter((day) => day.status === 'under_review' || day.status === 'submitted').length,
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
      days: journeyDays,
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
    courses,
  };

  return res.status(200).json({ detail });
}
