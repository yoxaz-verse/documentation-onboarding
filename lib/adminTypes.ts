export type AdminMilestoneStat = {
  step: number;
  label: string;
  count: number;
};

export type AdminOverview = {
  totalOperators: number;
  completedOperators: number;
  inProgressOperators: number;
  completionRate: number;
  stepCompletion: AdminMilestoneStat[];
};

export type AdminOperatorRow = {
  email: string;
  name: string | null;
  profileName: string | null;
  currentStep: number;
  completedMilestones: number;
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
