import { buildCourseProgressSummary } from './courseProgress';
import type { LeaderboardEntry } from './types';

type QuizPerformanceRow = {
  email: string;
  module_id: string;
  ever_passed: boolean;
  last_attempt_at: string | null;
};

type OperatorLike = {
  email: string;
  name?: string | null;
};

type ProfileLike = {
  email: string;
  full_name?: string | null;
};

export function buildLeaderboardEntries(
  operators: OperatorLike[],
  profiles: ProfileLike[],
  quizRows: QuizPerformanceRow[],
  currentUserEmail: string
): LeaderboardEntry[] {
  const operatorMap = new Map(operators.map((operator) => [operator.email, operator]));
  const profileMap = new Map(profiles.map((profile) => [profile.email, profile]));
  const allEmails = new Set<string>([
    ...operators.map((operator) => operator.email),
    ...profiles.map((profile) => profile.email),
    ...quizRows.map((row) => row.email),
  ]);

  const quizByEmail = new Map<string, QuizPerformanceRow[]>();
  for (const row of quizRows) {
    const current = quizByEmail.get(row.email) || [];
    current.push(row);
    quizByEmail.set(row.email, current);
  }

  const ranked = Array.from(allEmails).map((email) => {
    const rows = quizByEmail.get(email) || [];
    const passedIds = new Set(rows.filter((row) => row.ever_passed).map((row) => row.module_id));
    const summary = buildCourseProgressSummary(passedIds);
    const latestAttemptAt =
      rows
        .map((row) => row.last_attempt_at)
        .filter(Boolean)
        .sort()
        .reverse()[0] || null;
    const operator = operatorMap.get(email);
    const profile = profileMap.get(email);
    const displayName = profile?.full_name || operator?.name || email.split('@')[0];

    return {
      email,
      displayName,
      points: summary.totalPoints,
      completedCourses: summary.passedCourses,
      completedLessons: summary.passedSubModules,
      lastActivityAt: latestAttemptAt,
      isCurrentUser: email === currentUserEmail,
    };
  });

  ranked.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.completedCourses !== a.completedCourses) return b.completedCourses - a.completedCourses;
    if (b.completedLessons !== a.completedLessons) return b.completedLessons - a.completedLessons;
    const aTime = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
    const bTime = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;
    if (bTime !== aTime) return bTime - aTime;
    return a.displayName.localeCompare(b.displayName);
  });

  return ranked.map((entry, index) => ({
    rank: index + 1,
    ...entry,
  }));
}
