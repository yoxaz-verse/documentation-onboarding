import type { CourseProgressSummary } from './courseProgress';
import type { JourneySummary } from './operatorJourney';
export type { CourseProgressSummary } from './courseProgress';
export type { JourneySummary } from './operatorJourney';

export type SessionUser = {
  email: string;
  name?: string | null;
};

export type ProgressRecord = {
  email: string;
  current_step: number;
  step1_completed?: boolean;
  step2_completed?: boolean;
  step3_completed?: boolean;
  step4_completed?: boolean;
  step1_completed_at?: string | null;
  step2_completed_at?: string | null;
  step3_completed_at?: string | null;
  step4_completed_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ProgressResponse = {
  progress: ProgressRecord;
  courseProgress: CourseProgressSummary;
};

export type JourneyResponse = {
  progress: ProgressRecord;
  courseProgress: CourseProgressSummary;
  journey: JourneySummary;
};

export type LeaderboardEntry = {
  rank: number;
  email: string;
  displayName: string;
  points: number;
  completedCourses: number;
  completedLessons: number;
  lastActivityAt: string | null;
  isCurrentUser: boolean;
};

export type LeaderboardResponse = {
  leaderboard: LeaderboardEntry[];
};

export type OperatorProfile = {
  email: string;
  full_name: string;
  phone: string;
  role_title: string;
  city: string;
  state: string;
  years_experience: string;
  total_work_experience_years: string;
  group_trading_experience_years: string;
  preferred_language: string;
  operator_background: string;
  motivation: string;
  official_company_email: string;
  zoho_acknowledged_at: string | null;
  zoho_contact_revealed_at: string | null;
  zoho_support_stage: string;
  created_at: string | null;
  updated_at: string | null;
};

export type OperatorProfileInput = Omit<OperatorProfile, 'created_at' | 'updated_at'>;

export type OperatorCredentialRecord = {
  email: string;
  mailbox_email: string;
  app_password_encrypted: string;
  notes: string;
  created_at: string | null;
  updated_at: string | null;
};

export type OperatorCredentialView = {
  mailboxEmail: string;
  notes: string;
  appPasswordSaved: boolean;
  updatedAt: string | null;
};
