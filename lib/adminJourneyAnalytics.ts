import type { JourneyDayTemplate } from '../config/operatorJourney';
import { getJourneyCurrentDay, type JourneyMilestoneRecord, type JourneySubmissionRecord } from './operatorJourney';
import type { AdminJourneyAnalytics, AdminJourneyTrackStatus } from './adminTypes';

const DAY_MS = 24 * 60 * 60 * 1000;

export type AdminJourneySource = {
  email: string;
  startedAt: string | null;
  stateUpdatedAt?: string | null;
  milestones: Array<Partial<JourneyMilestoneRecord> & { updated_at?: string | null }>;
  submissions: Array<Partial<JourneySubmissionRecord>>;
  templates: JourneyDayTemplate[];
  now?: Date;
};

export type AdminJourneySnapshot = {
  status: AdminJourneyTrackStatus;
  actionDay: number | null;
  expectedDay: number | null;
  completedCount: number;
  totalDays: number;
  pendingReviewCount: number;
  needsCorrectionCount: number;
  lastSubmissionAt: string | null;
  latestActivityAt: string | null;
};

function latest(values: Array<string | null | undefined>) {
  return values.filter(Boolean).sort().reverse()[0] || null;
}

function daysSince(value: string | null, now: Date) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.floor(Math.max(0, now.getTime() - date.getTime()) / DAY_MS);
}

function dayForMilestoneId(templateById: Map<string, JourneyDayTemplate>, milestoneId: string | undefined) {
  if (!milestoneId) return null;
  return templateById.get(milestoneId)?.day || null;
}

export function buildAdminJourneySnapshot(source: AdminJourneySource): AdminJourneySnapshot {
  const now = source.now || new Date();
  const activeTemplates = source.templates.filter((template) => template.isActive !== false).sort((a, b) => a.day - b.day);
  const templateById = new Map(activeTemplates.map((template) => [template.id, template]));
  const totalDays = activeTemplates.length || 30;

  const completedDays = new Set<number>();
  source.milestones.forEach((milestone) => {
    const day = dayForMilestoneId(templateById, String(milestone.milestone_id || ''));
    if (day) completedDays.add(day);
  });
  source.submissions.forEach((submission) => {
    if (submission.status === 'completed' && submission.day_number) completedDays.add(Number(submission.day_number));
  });

  const actionDay = activeTemplates.find((template) => !completedDays.has(template.day))?.day || null;
  const rawExpectedDay = source.startedAt ? getJourneyCurrentDay(source.startedAt, now) : null;
  const expectedDay = rawExpectedDay ? Math.min(Math.max(rawExpectedDay, 1), totalDays) : null;
  const pendingReviewCount = source.submissions.filter((submission) => submission.status === 'under_review').length;
  const needsCorrectionCount = source.submissions.filter((submission) => submission.status === 'needs_correction').length;
  const lastSubmissionAt = latest(source.submissions.map((submission) => submission.updated_at || submission.reviewed_at || submission.submitted_at || submission.created_at || null));
  const latestActivityAt = latest([
    source.stateUpdatedAt,
    ...source.milestones.map((milestone) => milestone.updated_at || milestone.completed_at || null),
    ...source.submissions.map((submission) => submission.updated_at || submission.reviewed_at || submission.submitted_at || submission.created_at || null),
  ]);

  let status: AdminJourneyTrackStatus = 'not_started';

  if (source.startedAt) {
    const inactiveDays = daysSince(latestActivityAt, now);
    const comparisonExpectedDay = rawExpectedDay || expectedDay || 1;

    if (completedDays.size >= totalDays) status = 'completed';
    else if (needsCorrectionCount > 0) status = 'needs_correction';
    else if (pendingReviewCount > 0) status = 'under_review';
    else if (inactiveDays !== null && inactiveDays >= 4) status = 'serious_inactive';
    else if (inactiveDays !== null && inactiveDays >= 2) status = 'short_inactive';
    else if (actionDay && actionDay > comparisonExpectedDay) status = 'ahead';
    else if (actionDay && actionDay < comparisonExpectedDay) status = 'behind';
    else status = 'on_track';
  }

  return {
    status,
    actionDay,
    expectedDay,
    completedCount: completedDays.size,
    totalDays,
    pendingReviewCount,
    needsCorrectionCount,
    lastSubmissionAt,
    latestActivityAt,
  };
}

export function emptyAdminJourneyAnalytics(totalDays = 30): AdminJourneyAnalytics {
  return {
    totalStarted: 0,
    notStarted: 0,
    ahead: 0,
    onTrack: 0,
    behind: 0,
    shortInactive: 0,
    seriousInactive: 0,
    underReview: 0,
    needsCorrection: 0,
    completed: 0,
    perDay: Array.from({ length: totalDays }, (_, index) => ({ day: index + 1, count: 0 })),
  };
}

export function buildAdminJourneyAnalytics(snapshots: AdminJourneySnapshot[], totalDays = 30): AdminJourneyAnalytics {
  const analytics = emptyAdminJourneyAnalytics(totalDays);

  snapshots.forEach((snapshot) => {
    if (snapshot.status === 'not_started') analytics.notStarted += 1;
    else analytics.totalStarted += 1;

    if (snapshot.status === 'ahead') analytics.ahead += 1;
    if (snapshot.status === 'on_track') analytics.onTrack += 1;
    if (snapshot.status === 'behind') analytics.behind += 1;
    if (snapshot.status === 'short_inactive') analytics.shortInactive += 1;
    if (snapshot.status === 'serious_inactive') analytics.seriousInactive += 1;
    if (snapshot.status === 'under_review') analytics.underReview += 1;
    if (snapshot.status === 'needs_correction') analytics.needsCorrection += 1;
    if (snapshot.status === 'completed') analytics.completed += 1;

    if (snapshot.actionDay) {
      const day = analytics.perDay.find((item) => item.day === snapshot.actionDay);
      if (day) day.count += 1;
    }
  });

  return analytics;
}
