import {
  JOURNEY_CHECKS,
  JOURNEY_DAY_TEMPLATES,
  JOURNEY_MILESTONES,
  JOURNEY_TOTAL_DAYS,
  type JourneyCheck,
  type JourneyDashboardMetrics,
  type JourneyDayTemplate,
  type JourneyDerivedStatus,
  type JourneyFormField,
  type JourneyMilestone,
  type JourneyRepeatGroup,
  type JourneySubmissionStatus,
} from '../config/operatorJourney';

export type JourneyStateRecord = {
  email: string;
  started_at: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type JourneyCheckRecord = {
  check_id: string;
  completed_at: string;
};

export type JourneyMilestoneRecord = {
  milestone_id: string;
  completed_at: string;
};

export type JourneyTemplateRecord = {
  template_id: string;
  day_number: number;
  title: string;
  description: string;
  category: string;
  href: string | null;
  action_label: string | null;
  is_active: boolean | null;
  rich_template?: JourneyDayTemplate | null;
  review_required?: boolean | null;
  button_text?: string | null;
  completion_message?: string | null;
};

export type JourneySubmissionRecord = {
  id: string;
  email: string;
  template_id: string;
  day_number: number;
  status: JourneySubmissionStatus;
  answers: Record<string, unknown> | null;
  computed_metrics: Record<string, unknown> | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_note: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type JourneyDayStatus = {
  day: number;
  templateId: string;
  status: JourneyDerivedStatus;
  label: string;
  submission: JourneySubmissionRecord | null;
};

export type JourneySummary = {
  startedAt: string | null;
  currentDay: number | null;
  totalDays: number;
  completedChecks: string[];
  completedMilestones: string[];
  completedCheckCount: number;
  completedMilestoneCount: number;
  totalCheckCount: number;
  totalMilestoneCount: number;
  checks: JourneyCheck[];
  milestones: JourneyMilestone[];
  dayTemplates: JourneyDayTemplate[];
  dayStatuses: JourneyDayStatus[];
  submissions: JourneySubmissionRecord[];
  metrics: JourneyDashboardMetrics;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function getJourneyCurrentDay(startedAt: string | null | undefined, now = new Date()) {
  if (!startedAt) return null;

  const started = new Date(startedAt);
  if (Number.isNaN(started.getTime())) return null;

  const elapsed = Math.max(0, now.getTime() - started.getTime());
  return Math.floor(elapsed / DAY_MS) + 1;
}

export function isValidJourneyCheckId(checkId: string) {
  return JOURNEY_CHECKS.some((check) => check.id === checkId);
}

export function isValidJourneyMilestoneId(milestoneId: string) {
  return JOURNEY_MILESTONES.some((milestone) => milestone.id === milestoneId);
}

export function normalizeJourneyTemplates(rows: Array<Partial<JourneyTemplateRecord>> | null | undefined): JourneyMilestone[] {
  if (!rows?.length) return JOURNEY_MILESTONES;

  const categories = new Set(['setup', 'learning', 'outreach', 'platform', 'deal']);
  const normalized = rows
    .map((row): JourneyMilestone | null => {
      const fallback = JOURNEY_MILESTONES.find((milestone) => milestone.id === row.template_id || milestone.day === row.day_number);
      const day = Number(row.day_number || fallback?.day || 0);
      const category = categories.has(String(row.category)) ? (String(row.category) as JourneyMilestone['category']) : fallback?.category || 'learning';
      const id = String(row.template_id || fallback?.id || '').trim();
      const title = String(row.title || fallback?.title || '').trim();
      const description = String(row.description || fallback?.description || '').trim();

      if (!id || !day || !title || !description) return null;

      return {
        id,
        day,
        title,
        description,
        category,
        href: String(row.href || fallback?.href || '').trim() || undefined,
        actionLabel: String(row.action_label || fallback?.actionLabel || '').trim() || undefined,
        isActive: row.is_active !== false,
      };
    })
    .filter((milestone): milestone is JourneyMilestone => Boolean(milestone))
    .sort((a, b) => a.day - b.day);

  return normalized.length ? normalized : JOURNEY_MILESTONES;
}

function normalizeTemplateRow(row: Partial<JourneyTemplateRecord>): JourneyDayTemplate | null {
  const fallback = JOURNEY_DAY_TEMPLATES.find((template) => template.id === row.template_id || template.day === row.day_number);
  const rich = row.rich_template && typeof row.rich_template === 'object' ? row.rich_template : null;
  const base = rich || fallback;
  if (!base) return null;

  const day = Number(row.day_number || base.day || 0);
  const id = String(row.template_id || base.id || '').trim();
  const title = String(row.title || base.title || '').trim();
  const description = String(row.description || base.description || '').trim();
  if (!id || !day || !title || !description) return null;

  return {
    ...base,
    id,
    day,
    title,
    description,
    category: (row.category as JourneyMilestone['category']) || base.category,
    href: String(row.href || base.href || '').trim() || undefined,
    actionLabel: String(row.action_label || base.actionLabel || '').trim() || undefined,
    isActive: row.is_active !== false,
    reviewRequired: row.review_required ?? base.reviewRequired,
    buttonText: String(row.button_text || base.buttonText || '').trim() || base.buttonText,
    completionMessage: String(row.completion_message || base.completionMessage || '').trim() || base.completionMessage,
    formFields: Array.isArray(base.formFields) ? base.formFields : [],
    repeatGroups: Array.isArray(base.repeatGroups) ? base.repeatGroups : [],
  };
}

export function normalizeJourneyDayTemplates(rows: Array<Partial<JourneyTemplateRecord>> | null | undefined): JourneyDayTemplate[] {
  if (!rows?.length) return JOURNEY_DAY_TEMPLATES;

  const normalized = rows
    .map(normalizeTemplateRow)
    .filter((template): template is JourneyDayTemplate => Boolean(template))
    .sort((a, b) => a.day - b.day);

  return normalized.length ? normalized : JOURNEY_DAY_TEMPLATES;
}

export function isValidJourneyMilestoneIdForTemplate(milestoneId: string, milestones: JourneyMilestone[]) {
  return milestones.some((milestone) => milestone.id === milestoneId);
}

export function buildJourneySummary(
  state: Partial<JourneyStateRecord> | null | undefined,
  checks: Array<Partial<JourneyCheckRecord>> = [],
  milestones: Array<Partial<JourneyMilestoneRecord>> = [],
  templates: JourneyDayTemplate[] | JourneyMilestone[] = JOURNEY_DAY_TEMPLATES,
  submissions: JourneySubmissionRecord[] = [],
  now = new Date()
): JourneySummary {
  const activeTemplates = templates.filter((milestone) => milestone.isActive !== false);
  const activeDayTemplates = activeTemplates.map((template) => {
    const rich = JOURNEY_DAY_TEMPLATES.find((dayTemplate) => dayTemplate.id === template.id || dayTemplate.day === template.day);
    return rich ? { ...rich, ...template } as JourneyDayTemplate : template as JourneyDayTemplate;
  });
  const completedChecks = new Set(
    checks
      .map((check) => String(check.check_id || ''))
      .filter((checkId) => isValidJourneyCheckId(checkId))
  );
  const completedMilestones = new Set(
    [
      ...milestones.map((milestone) => String(milestone.milestone_id || '')),
      ...submissions.filter((submission) => submission.status === 'completed').map((submission) => submission.template_id),
    ]
      .filter((milestoneId) => isValidJourneyMilestoneIdForTemplate(milestoneId, activeTemplates))
  );
  const startedAt = state?.started_at || null;
  const currentDay = getJourneyCurrentDay(startedAt, now);
  const dayStatuses = buildJourneyDayStatuses(activeDayTemplates, submissions, currentDay);

  return {
    startedAt,
    currentDay,
    totalDays: JOURNEY_TOTAL_DAYS,
    completedChecks: Array.from(completedChecks),
    completedMilestones: Array.from(completedMilestones),
    completedCheckCount: completedChecks.size,
    completedMilestoneCount: completedMilestones.size,
    totalCheckCount: JOURNEY_CHECKS.length,
    totalMilestoneCount: activeTemplates.length,
    checks: JOURNEY_CHECKS,
    milestones: activeTemplates,
    dayTemplates: activeDayTemplates,
    dayStatuses,
    submissions,
    metrics: buildJourneyMetrics(submissions, activeDayTemplates),
  };
}

export function areJourneyChecksComplete(completedCheckIds: string[]) {
  const completed = new Set(completedCheckIds);
  return JOURNEY_CHECKS.every((check) => completed.has(check.id));
}

function isEmptyValue(value: unknown) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function isTruthyAnswer(value: unknown) {
  if (value === true) return true;
  if (typeof value === 'string') return ['yes', 'true', 'ready to quote', 'completed'].includes(value.trim().toLowerCase());
  return Boolean(value);
}

function validateField(field: JourneyFormField, value: unknown, prefix: string, errors: string[]) {
  if (field.required && (field.type === 'checkbox' ? value !== true : isEmptyValue(value))) {
    errors.push(`${prefix}${field.label} is required.`);
    return;
  }

  if (field.type === 'number' && !isEmptyValue(value)) {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) errors.push(`${prefix}${field.label} must be a number.`);
    if (field.min !== undefined && numeric < field.min) errors.push(`${prefix}${field.label} must be at least ${field.min}.`);
    if (field.max !== undefined && numeric > field.max) errors.push(`${prefix}${field.label} must be at most ${field.max}.`);
  }
}

function validateRepeatGroup(group: JourneyRepeatGroup, value: unknown, errors: string[]) {
  const entries = Array.isArray(value) ? value : [];
  if (entries.length < group.minEntries) {
    errors.push(`${group.label} needs at least ${group.minEntries} ${group.minEntries === 1 ? 'entry' : 'entries'}.`);
  }

  entries.forEach((entry, index) => {
    const values = entry && typeof entry === 'object' ? entry as Record<string, unknown> : {};
    group.fields.forEach((field) => validateField(field, values[field.id], `${group.label} #${index + 1}: `, errors));
  });
}

export function validateJourneyAnswers(template: JourneyDayTemplate, answers: Record<string, unknown>) {
  const errors: string[] = [];
  template.formFields.forEach((field) => validateField(field, answers[field.id], '', errors));
  template.repeatGroups.forEach((group) => validateRepeatGroup(group, answers[group.id], errors));

  template.keywordRules?.forEach((rule) => {
    const text = String(answers[rule.fieldId] || '').toLowerCase();
    const missing = rule.keywords.filter((keyword) => !text.includes(keyword.toLowerCase()));
    if (missing.length) errors.push(`The answer for ${rule.fieldId} must mention: ${missing.join(', ')}.`);
  });

  return { valid: errors.length === 0, errors };
}

export function computeJourneySubmissionMetrics(template: JourneyDayTemplate, answers: Record<string, unknown>) {
  const metrics: Record<string, unknown> = {};

  if (template.day === 24) metrics.matchesAttempted = 1;
  if (template.day === 30) {
    const scoreFields = ['product_confidence', 'supplier_confidence', 'buyer_confidence', 'payment_term_confidence', 'incoterm_confidence', 'cluster_usage_confidence'];
    metrics.readinessScore = scoreFields.reduce((sum, fieldId) => sum + Number(answers[fieldId] || 0), 0);
  }

  template.metricMaps?.forEach((map) => {
    if (map.mode === 'countGroupEntries' && map.groupId) {
      metrics[map.metric] = Array.isArray(answers[map.groupId]) ? (answers[map.groupId] as unknown[]).length : 0;
    }
    if (map.mode === 'countTruthy' && map.groupId && map.fieldId) {
      const entries = Array.isArray(answers[map.groupId]) ? answers[map.groupId] as Array<Record<string, unknown>> : [];
      metrics[map.metric] = entries.filter((entry) => isTruthyAnswer(entry?.[map.fieldId!])).length;
    }
    if (map.mode === 'numericField' && map.fieldId) {
      metrics[map.metric] = Number(answers[map.fieldId] || metrics[map.metric] || 0);
    }
    if (map.mode === 'scoreAverage' && map.groupId && map.fieldId) {
      const entries = Array.isArray(answers[map.groupId]) ? answers[map.groupId] as Array<Record<string, unknown>> : [];
      const scores = entries.map((entry) => Number(entry?.[map.fieldId!] || 0)).filter((score) => !Number.isNaN(score));
      metrics[map.metric] = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
    }
  });

  return metrics;
}

export function buildJourneyDayStatuses(templates: JourneyDayTemplate[], submissions: JourneySubmissionRecord[], currentDay: number | null): JourneyDayStatus[] {
  const byDay = new Map(submissions.map((submission) => [submission.day_number, submission]));

  return templates.map((template) => {
    const submission = byDay.get(template.day) || null;
    let status: JourneyDerivedStatus = 'upcoming';
    if (submission) status = submission.status;
    else if (!currentDay) status = 'pending';
    else if (template.day === currentDay) status = 'today';
    else if (template.day < currentDay) status = 'catch_up';
    else status = 'upcoming';

    const label = status === 'under_review'
      ? 'Under review'
      : status === 'needs_correction'
        ? 'Needs correction'
        : status === 'catch_up'
          ? 'Catch up'
          : status.charAt(0).toUpperCase() + status.slice(1);

    return {
      day: template.day,
      templateId: template.id,
      status,
      label,
      submission,
    };
  });
}

export function emptyJourneyMetrics(): JourneyDashboardMetrics {
  return {
    suppliersAdded: 0,
    buyersAdded: 0,
    productsMapped: 0,
    availabilitiesLogged: 0,
    buyerRequirementsLogged: 0,
    outreachDone: 0,
    responsesReceived: 0,
    followUpsPending: 0,
    matchesAttempted: 0,
    quotationReadyInquiries: 0,
    opportunityScoreAverage: 0,
    executionReadinessScore: 0,
  };
}

export function buildJourneyMetrics(submissions: JourneySubmissionRecord[], templates: JourneyDayTemplate[] = JOURNEY_DAY_TEMPLATES): JourneyDashboardMetrics {
  const metrics = emptyJourneyMetrics();
  const averageScores: number[] = [];

  submissions
    .filter((submission) => submission.status === 'completed' || submission.status === 'under_review')
    .forEach((submission) => {
      const template = templates.find((item) => item.id === submission.template_id || item.day === submission.day_number);
      const computed = submission.computed_metrics || computeJourneySubmissionMetrics(template || JOURNEY_DAY_TEMPLATES[0], submission.answers || {});

      Object.entries(computed).forEach(([key, rawValue]) => {
        if (!(key in metrics)) return;
        const metricKey = key as keyof JourneyDashboardMetrics;
        const value = Number(rawValue || 0);
        if (metricKey === 'opportunityScoreAverage') {
          if (value > 0) averageScores.push(value);
        } else if (metricKey === 'executionReadinessScore') {
          metrics.executionReadinessScore = Math.max(metrics.executionReadinessScore, value);
        } else {
          metrics[metricKey] += value;
        }
      });
    });

  metrics.opportunityScoreAverage = averageScores.length ? Math.round(averageScores.reduce((sum, score) => sum + score, 0) / averageScores.length) : 0;
  return metrics;
}
