import { JOURNEY_CHECKS, JOURNEY_MILESTONES, JOURNEY_TOTAL_DAYS, type JourneyCheck, type JourneyMilestone } from '../config/operatorJourney';

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

export function isValidJourneyMilestoneIdForTemplate(milestoneId: string, milestones: JourneyMilestone[]) {
  return milestones.some((milestone) => milestone.id === milestoneId);
}

export function buildJourneySummary(
  state: Partial<JourneyStateRecord> | null | undefined,
  checks: Array<Partial<JourneyCheckRecord>> = [],
  milestones: Array<Partial<JourneyMilestoneRecord>> = [],
  templates: JourneyMilestone[] = JOURNEY_MILESTONES,
  now = new Date()
): JourneySummary {
  const activeTemplates = templates.filter((milestone) => milestone.isActive !== false);
  const completedChecks = new Set(
    checks
      .map((check) => String(check.check_id || ''))
      .filter((checkId) => isValidJourneyCheckId(checkId))
  );
  const completedMilestones = new Set(
    milestones
      .map((milestone) => String(milestone.milestone_id || ''))
      .filter((milestoneId) => isValidJourneyMilestoneIdForTemplate(milestoneId, activeTemplates))
  );
  const startedAt = state?.started_at || null;

  return {
    startedAt,
    currentDay: getJourneyCurrentDay(startedAt, now),
    totalDays: JOURNEY_TOTAL_DAYS,
    completedChecks: Array.from(completedChecks),
    completedMilestones: Array.from(completedMilestones),
    completedCheckCount: completedChecks.size,
    completedMilestoneCount: completedMilestones.size,
    totalCheckCount: JOURNEY_CHECKS.length,
    totalMilestoneCount: activeTemplates.length,
    checks: JOURNEY_CHECKS,
    milestones: activeTemplates,
  };
}

export function areJourneyChecksComplete(completedCheckIds: string[]) {
  const completed = new Set(completedCheckIds);
  return JOURNEY_CHECKS.every((check) => completed.has(check.id));
}
