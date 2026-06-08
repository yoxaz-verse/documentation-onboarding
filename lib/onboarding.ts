import type { ProgressRecord } from './types';

export type MilestoneNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
export type StepKey = MilestoneNumber;

type ProgressLike = Partial<ProgressRecord> | null | undefined;

export type MilestoneDefinition = {
  number: MilestoneNumber;
  slug: string;
  label: string;
  shortLabel: string;
  summary: string;
  route: string;
};

export const FINAL_MILESTONE: MilestoneNumber = 11;
export const COURSES_UNLOCK_AT_STEP = 11;
export const FULLY_COMPLETED_STEP_INDEX = 12;
export const LEGACY_COMPLETION_STEP_COUNT = 4;

export const MILESTONES: MilestoneDefinition[] = [
  {
    number: 1,
    slug: 'company-overview',
    label: 'Company Overview',
    shortLabel: 'Company',
    summary: 'Understand what OBAOL does and why this operator system exists.',
    route: '/step1',
  },
  {
    number: 2,
    slug: 'operator-model',
    label: 'Operator Model Overview',
    shortLabel: 'Model',
    summary: 'See how operators fit into the system before doing any setup.',
    route: '/step2',
  },
  {
    number: 3,
    slug: 'role-expectations',
    label: 'Role Expectations',
    shortLabel: 'Expectations',
    summary: 'Confirm the operating expectations, including that this is not a salaried job.',
    route: '/step3',
  },
  {
    number: 4,
    slug: 'commission-review',
    label: 'Commission and Role Review',
    shortLabel: 'Commission',
    summary: 'Review the commission structure and support material.',
    route: '/step4',
  },
  {
    number: 5,
    slug: 'fit-confirmation',
    label: 'Fit Confirmation',
    shortLabel: 'Fit Check',
    summary: 'Confirm that you are comfortable moving forward with the operator system.',
    route: '/step5',
  },
  {
    number: 6,
    slug: 'experience-capture',
    label: 'Experience and Motivation',
    shortLabel: 'Profile',
    summary: 'Share your background, preferred language, and why you want to join.',
    route: '/step6',
  },
  {
    number: 7,
    slug: 'official-email',
    label: 'Official Email Setup',
    shortLabel: 'Email',
    summary: 'Create and submit the official email you will use for Zoho Workspace and operator communication.',
    route: '/step7',
  },
  {
    number: 8,
    slug: 'operator-platform-registration',
    label: 'Operator Platform Registration',
    shortLabel: 'Register',
    summary: 'Register on the OBAOL platform after creating your official email, preferably using that same email for cleaner organization.',
    route: '/step8',
  },
  {
    number: 9,
    slug: 'zoho-intro',
    label: 'Zoho and Communication Setup',
    shortLabel: 'Zoho Intro',
    summary: 'Learn why Zoho Cliq is used and how to join the communication workspace.',
    route: '/step9',
  },
  {
    number: 10,
    slug: 'zoho-confirmation',
    label: 'Zoho Completion Check',
    shortLabel: 'Zoho Check',
    summary: 'Confirm you completed the Zoho step and unlock support escalation timing if needed.',
    route: '/step10',
  },
  {
    number: 11,
    slug: 'courses-unlocked',
    label: 'Courses Unlocked',
    shortLabel: 'Courses',
    summary: 'Enter the operator training library once all guided onboarding is complete.',
    route: '/step11',
  },
];

export const STEP_ROUTE: Record<MilestoneNumber, string> = MILESTONES.reduce((acc, milestone) => {
  acc[milestone.number] = milestone.route;
  return acc;
}, {} as Record<MilestoneNumber, string>);

export function clampCurrentStep(rawStep: number) {
  if (!Number.isFinite(rawStep) || rawStep < 1) return 1;
  if (rawStep > FULLY_COMPLETED_STEP_INDEX) return FULLY_COMPLETED_STEP_INDEX;
  return Math.floor(rawStep);
}

export function getMilestone(step: number) {
  return MILESTONES.find((milestone) => milestone.number === step) || null;
}

export function getCurrentStep(progress: ProgressLike) {
  return clampCurrentStep(Number(progress?.current_step || 1));
}

export function firstIncompleteStep(progress: ProgressLike): MilestoneNumber {
  const current = getCurrentStep(progress);
  if (current > FINAL_MILESTONE) return FINAL_MILESTONE;
  return current as MilestoneNumber;
}

export function getCompletedMilestoneCount(progress: ProgressLike) {
  return Math.max(0, Math.min(FINAL_MILESTONE, getCurrentStep(progress) - 1));
}

export function isMilestoneCompleted(progress: ProgressLike, step: MilestoneNumber) {
  return getCurrentStep(progress) > step;
}

export function canAccessStep(progress: ProgressLike, step: MilestoneNumber) {
  return step <= getCurrentStep(progress);
}

export function areCoursesUnlocked(progress: ProgressLike) {
  return getCurrentStep(progress) >= COURSES_UNLOCK_AT_STEP;
}

export function getNextMilestone(progress: ProgressLike) {
  if (getCurrentStep(progress) > FINAL_MILESTONE) return null;
  return getMilestone(firstIncompleteStep(progress));
}

export function normalizeProgressRecord(record: ProgressLike): ProgressRecord | null {
  if (!record) return null;

  const currentStep = getCurrentStep(record);
  return {
    email: String(record.email || ''),
    ...record,
    current_step: currentStep,
    step1_completed: currentStep > 1,
    step2_completed: currentStep > 2,
    step3_completed: currentStep > 3,
    step4_completed: currentStep > 4,
    step1_completed_at: record.step1_completed_at || null,
    step2_completed_at: record.step2_completed_at || null,
    step3_completed_at: record.step3_completed_at || null,
    step4_completed_at: record.step4_completed_at || null,
  };
}

export function buildProgressUpdate(currentStep: number, existing?: ProgressLike, completedAt = new Date().toISOString()) {
  const normalizedStep = clampCurrentStep(currentStep);
  const normalizedExisting = normalizeProgressRecord(existing);

  return {
    current_step: normalizedStep,
    step1_completed: normalizedStep > 1,
    step2_completed: normalizedStep > 2,
    step3_completed: normalizedStep > 3,
    step4_completed: normalizedStep > 4,
    step1_completed_at: normalizedStep > 1 ? normalizedExisting?.step1_completed_at || completedAt : null,
    step2_completed_at: normalizedStep > 2 ? normalizedExisting?.step2_completed_at || completedAt : null,
    step3_completed_at: normalizedStep > 3 ? normalizedExisting?.step3_completed_at || completedAt : null,
    step4_completed_at: normalizedStep > 4 ? normalizedExisting?.step4_completed_at || completedAt : null,
  };
}

export function generateCompletionCode(): string {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `OBAOL-${random}`;
}
