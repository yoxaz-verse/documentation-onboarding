import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import AuthGate from '../../components/AuthGate';
import OnboardingLayout from '../../components/OnboardingLayout';
import styles from '../onboarding.module.css';
import { getAllCourses } from '../../config/courses';
import { isUnauthorizedError } from '../../lib/http';
import { areCoursesUnlocked } from '../../lib/onboarding';
import { getProgressBundle } from '../../lib/progress';
import type { CourseProgressSummary, LeaderboardEntry, ProgressRecord } from '../../lib/types';

function statusLabel(summary?: { status: 'locked' | 'in_progress' | 'passed'; completedSubModules: number }) {
  if (!summary) return 'Ready to start';
  if (summary.status === 'passed') return 'Completed';
  if (summary.completedSubModules > 0) return 'In progress';
  return 'Ready to start';
}

function courseThemeClass(theme: string) {
  if (theme === 'builds') return styles.courseCoverBuilds;
  if (theme === 'code') return styles.courseCoverCode;
  if (theme === 'product') return styles.courseCoverProduct;
  if (theme === 'calls') return styles.courseCoverCalls;
  return '';
}

function ClassroomCatalogContent() {
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState<ProgressRecord | null>(null);
  const [courseProgress, setCourseProgress] = useState<CourseProgressSummary | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [message, setMessage] = useState('');

  const courses = useMemo(() => getAllCourses(), []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [bundle, leaderboardResponse] = await Promise.all([
          getProgressBundle(),
          fetch('/api/leaderboard', { credentials: 'include' }),
        ]);

        if (!active) return;

        let leaderboardPayload: { leaderboard?: LeaderboardEntry[]; error?: string } = {};
        if (leaderboardResponse.ok) {
          leaderboardPayload = await leaderboardResponse.json();
        } else {
          leaderboardPayload = await leaderboardResponse.json().catch(() => ({}));
        }

        if (!areCoursesUnlocked(bundle.progress)) {
          window.location.assign('/step10');
          return;
        }

        setProgress(bundle.progress);
        setCourseProgress(bundle.courseProgress);
        setLeaderboard(leaderboardPayload.leaderboard || []);
        setMessage('');
      } catch (error) {
        if (!active) return;
        if (isUnauthorizedError(error)) {
          window.location.assign('/');
          return;
        }

        setMessage(error instanceof Error ? error.message : 'Failed to load the classroom.');
      } finally {
        if (active) setReady(true);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  if (!ready) {
    return (
      <OnboardingLayout title="Classroom" subtitle="Loading your classroom catalog, progress, and leaderboard..." loading>
        <p className={styles.message}>Loading classroom...</p>
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout
      title="Operator Training Library"
      subtitle="Access operator-specific training tracks, keep every lesson saved, and build readiness only after the guided onboarding path is complete."
      progress={progress}
      courseProgress={courseProgress}
      loading={!ready}
      aside={
        <section className={styles.leaderboardPanel}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sideTitleLike}>Leaderboard</h2>
              <p className={styles.sectionHint}>Points from passed lessons and completed courses.</p>
            </div>
            <span className={styles.pointsBadge}>{courseProgress?.totalPoints || 0} pts</span>
          </div>
          <div className={styles.leaderboardList}>
            {leaderboard.map((entry) => (
              <article key={entry.email} className={`${styles.leaderboardItem} ${entry.isCurrentUser ? styles.leaderboardItemCurrent : ''}`}>
                <div className={styles.leaderboardRank}>#{entry.rank}</div>
                <div className={styles.leaderboardMeta}>
                  <p className={styles.leaderboardName}>{entry.displayName}</p>
                  <p className={styles.leaderboardStats}>
                    {entry.completedCourses} courses · {entry.completedLessons} lessons
                  </p>
                </div>
                <div className={styles.leaderboardPoints}>{entry.points}</div>
              </article>
            ))}
          </div>
        </section>
      }
    >
      <div className={styles.kpiGrid}>
        <section className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Classrooms completed</p>
          <p className={styles.kpiValue}>
            {courseProgress?.passedCourses || 0}/{courseProgress?.totalCourses || 0}
          </p>
        </section>
        <section className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Lessons completed</p>
          <p className={styles.kpiValue}>
            {courseProgress?.passedSubModules || 0}/{courseProgress?.totalSubModules || 0}
          </p>
        </section>
      </div>

      {message ? <p className={`${styles.message} ${styles.messageError}`}>{message}</p> : null}

      <section className={styles.callout}>
        <h2 className={styles.calloutTitle}>Course access inside the operator workspace</h2>
        <p className={styles.calloutText}>
          Each card opens one guided training track. Progress is saved automatically, and the opening overview is designed to feel like one continuous orientation instead of split parts.
        </p>
      </section>

      <section className={styles.catalogGrid}>
        {courses.map((course) => {
          const summary = courseProgress?.courses.find((item) => item.id === course.id);
          const percent = summary?.percentComplete || 0;

          return (
            <article key={course.id} className={styles.courseCard}>
              <div className={`${styles.courseCover} ${courseThemeClass(course.catalog.theme)}`}>
                <div className={styles.courseCoverInner}>
                  <div className={styles.courseIcon}>{course.catalog.icon}</div>
                  <div>
                    <p className={styles.courseCoverTitle}>{course.catalog.coverTitle}</p>
                    <p className={styles.courseCoverSubtitle}>{course.catalog.coverSubtitle}</p>
                  </div>
                </div>
              </div>

              <div className={styles.courseCardBody}>
                <div className={styles.courseCardHeader}>
                  <h3 className={styles.courseCardTitle}>{course.title}</h3>
                  {course.catalog.badge ? <span className={styles.courseBadge}>{course.catalog.badge}</span> : null}
                </div>
                <p className={styles.courseCardText}>{course.catalog.summary}</p>
                <p className={styles.courseCardMeta}>
                  {summary?.completedSubModules || 0}/{summary?.totalSubModules || course.subModules.length} {course.subModules.length === 1 ? 'lesson' : 'lessons'} complete · {statusLabel(summary)}
                </p>

                <div className={styles.progressTrack}>
                  <span className={styles.progressFill} style={{ width: `${percent}%` }} />
                </div>

                <div className={styles.cardActions}>
                  <Link href={`/courses/${course.id}`} className={styles.cta}>
                    {summary?.activeSubModuleId || summary?.status === 'passed' ? 'Open classroom' : 'Start classroom'}
                  </Link>
                  <p className={styles.calloutHint}>{percent}% complete</p>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </OnboardingLayout>
  );
}

export default function ClassroomCatalogPage() {
  return <AuthGate>{() => <ClassroomCatalogContent />}</AuthGate>;
}
