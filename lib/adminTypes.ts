export type AdminMilestoneStat = {
  step: number;
  label: string;
  count: number;
};

export type AdminJourneyTrackStatus =
  | 'not_started'
  | 'ahead'
  | 'on_track'
  | 'behind'
  | 'short_inactive'
  | 'serious_inactive'
  | 'under_review'
  | 'needs_correction'
  | 'completed';

export type AdminOnboardingStepStatus = 'completed' | 'current' | 'not_completed';

export type AdminJourneyDayStat = {
  day: number;
  count: number;
};

export type AdminJourneyAnalytics = {
  totalStarted: number;
  notStarted: number;
  ahead: number;
  onTrack: number;
  behind: number;
  shortInactive: number;
  seriousInactive: number;
  underReview: number;
  needsCorrection: number;
  completed: number;
  perDay: AdminJourneyDayStat[];
};

export type AdminOverview = {
  totalOperators: number;
  completedOperators: number;
  inProgressOperators: number;
  completionRate: number;
  stepCompletion: AdminMilestoneStat[];
  journey: AdminJourneyAnalytics;
};

export type AdminOperatorRow = {
  email: string;
  name: string | null;
  profileName: string | null;
  currentStep: number;
  completedMilestones: number;
  journeyStartedAt: string | null;
  journeyCurrentDay: number | null;
  journeyTrackStatus: AdminJourneyTrackStatus;
  journeyActionDay: number | null;
  journeyExpectedDay: number | null;
  journeyLastSubmissionAt: string | null;
  journeyPendingReviewCount: number;
  journeyNeedsCorrectionCount: number;
  journeyCompletedMilestones: number;
  journeyTotalMilestones: number;
  onboardingStepStatus: AdminOnboardingStepStatus;
  submissionStatus: string;
  hasCompletionCode: boolean;
  latestActivityAt: string | null;
};

export type AdminOperatorDetail = {
  operator: {
    email: string;
    name: string | null;
    phone: string | null;
    role: string | null;
    company: string | null;
    timezone: string | null;
    createdAt: string | null;
    updatedAt: string | null;
  };
  summary: {
    displayName: string;
    latestActivityAt: string | null;
    currentStepLabel: string;
    progressState: 'not_started' | 'in_progress' | 'completed';
    submissionState: 'missing' | 'pending' | 'completed';
  };
  profile: {
    fullName: string;
    phone: string;
    roleTitle: string;
    city: string;
    state: string;
    yearsExperience: string;
    totalWorkExperienceYears: string;
    agroTradeExperienceYears: string;
    preferredLanguage: string;
    officialCompanyEmail: string;
    motivation: string;
    operatorBackground: string;
    profilePhotoUrl: string;
    createdAt: string | null;
    updatedAt: string | null;
  } | null;
  progress: {
    currentStep: number;
    completedMilestones: number;
    createdAt: string | null;
    updatedAt: string | null;
    milestones: Array<{
      step: number;
      label: string;
      completed: boolean;
    }>;
  } | null;
  journey: {
    startedAt: string | null;
    currentDay: number | null;
    completedMilestones: number;
    totalMilestones: number;
    completedChecks: number;
    totalChecks: number;
    latestActivityAt: string | null;
  };
  stepSections: Array<{
    step: number;
    label: string;
    shortLabel: string;
    summary: string;
    status: 'complete' | 'current' | 'upcoming';
    statusLabel: string;
    note: string;
    fields: Array<{
      label: string;
      value: string;
      tone?: 'default' | 'muted';
    }>;
  }>;
  submission: {
    status: string;
    completionCode: string | null;
    submittedAt: string | null;
    createdAt: string | null;
    updatedAt: string | null;
  } | null;
  quizSummary: Array<{
    moduleId: string;
    bestScore: number;
    attempts: number;
    everPassed: boolean;
    lastAttemptAt: string | null;
  }>;
};
