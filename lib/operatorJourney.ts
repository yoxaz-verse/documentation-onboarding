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

export function buildJourneySummary(
  state: Partial<JourneyStateRecord> | null | undefined,
  checks: Array<Partial<JourneyCheckRecord>> = [],
  milestones: Array<Partial<JourneyMilestoneRecord>> = [],
  now = new Date()
): JourneySummary {
  const completedChecks = new Set(
    checks
      .map((check) => String(check.check_id || ''))
      .filter((checkId) => isValidJourneyCheckId(checkId))
  );
  const completedMilestones = new Set(
    milestones
      .map((milestone) => String(milestone.milestone_id || ''))
      .filter((milestoneId) => isValidJourneyMilestoneId(milestoneId))
  );
  const startedAt = state?.started_at || null;

  return {
    startedAt,
    currentDay: getJourneyCurrentDay(startedAt, now),
    totalDays: JOURNEY_TOTAL_DAYS,
    completedChecks: [...completedChecks],
    completedMilestones: [...completedMilestones],
    completedCheckCount: completedChecks.size,
    completedMilestoneCount: completedMilestones.size,
    totalCheckCount: JOURNEY_CHECKS.length,
    totalMilestoneCount: JOURNEY_MILESTONES.length,
    checks: JOURNEY_CHECKS,
    milestones: JOURNEY_MILESTONES,
  };
}

export function areJourneyChecksComplete(completedCheckIds: string[]) {
  const completed = new Set(completedCheckIds);
  return JOURNEY_CHECKS.every((check) => completed.has(check.id));
}
