import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import AuthGate from '../../components/AuthGate';
import OnboardingLayout from '../../components/OnboardingLayout';
import QuizModule from '../../components/QuizModule';
import styles from '../onboarding.module.css';
import { getCourseById, getSubModuleById } from '../../config/courses';
import { isUnauthorizedError } from '../../lib/http';
import { areCoursesUnlocked } from '../../lib/onboarding';
import { getProgressBundle } from '../../lib/progress';
import type { CourseProgressSummary, LeaderboardEntry, ProgressRecord } from '../../lib/types';

function lessonWord(count: number) {
  return count === 1 ? 'lesson' : 'lessons';
}

function getLessonStatusLabel(status: 'locked' | 'in_progress' | 'passed') {
  if (status === 'passed') return 'Passed';
  if (status === 'in_progress') return 'Current';
  return 'Locked';
}

function courseThemeClass(theme: string) {
  if (theme === 'builds') return styles.courseCoverBuilds;
  if (theme === 'code') return styles.courseCoverCode;
  if (theme === 'product') return styles.courseCoverProduct;
  if (theme === 'calls') return styles.courseCoverCalls;
  return '';
}

function accordionStatusLabel(status?: 'locked' | 'in_progress' | 'passed') {
  if (!status) return 'Choose a lesson';
  if (status === 'passed') return 'Passed';
  if (status === 'in_progress') return 'Current lesson';
  return 'Locked';
}

function ClassroomDetailContent() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState<ProgressRecord | null>(null);
  const [courseProgress, setCourseProgress] = useState<CourseProgressSummary | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedSubModuleId, setSelectedSubModuleId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const courseId = typeof router.query.courseId === 'string' ? router.query.courseId : '';
  const course = useMemo(() => (courseId ? getCourseById(courseId) : null), [courseId]);

  const reload = async (completedSubModuleId?: string) => {
    const [bundle, leaderboardResponse] = await Promise.all([
      getProgressBundle(),
      fetch('/api/leaderboard', { credentials: 'include' }),
    ]);

    const leaderboardPayload = leaderboardResponse.ok ? await leaderboardResponse.json() : await leaderboardResponse.json().catch(() => ({}));
    if (!areCoursesUnlocked(bundle.progress)) {
      router.replace('/step10');
      return;
    }
    setProgress(bundle.progress);
    setCourseProgress(bundle.courseProgress);
    setLeaderboard(leaderboardPayload.leaderboard || []);

    const courseSummary = bundle.courseProgress.courses.find((item) => item.id === courseId);
    if (courseSummary) {
      if (completedSubModuleId) {
        const currentIndex = courseSummary.subModules.findIndex((item) => item.id === completedSubModuleId);
        const nextSubModule = courseSummary.subModules[currentIndex + 1];
        if (nextSubModule && nextSubModule.status !== 'locked') {
          setSelectedSubModuleId(nextSubModule.id);
          return;
        }
      }
      setSelectedSubModuleId((current) => {
        if (current && courseSummary.subModules.some((item) => item.id === current && item.status !== 'locked')) return current;
        return courseSummary.activeSubModuleId || courseSummary.subModules[0]?.id || null;
      });
    }
  };

  useEffect(() => {
    if (!router.isReady) return;

    let active = true;
    const load = async () => {
      try {
        if (!course) {
          router.replace('/courses');
          return;
        }

        await reload();
        if (active) setMessage('');
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
  }, [router.isReady, courseId]);

  if (!ready) {
    return (
      <OnboardingLayout title="Classroom" subtitle="Loading your course classroom..." loading>
        <p className={styles.message}>Loading classroom...</p>
      </OnboardingLayout>
    );
  }

  if (!course) {
    return (
      <OnboardingLayout title="Classroom not found" subtitle="This classroom does not exist or is no longer available.">
        <Link href="/courses" className={styles.cta}>
          Back to classroom catalog
        </Link>
      </OnboardingLayout>
    );
  }

  const courseSummary = courseProgress?.courses.find((item) => item.id === course.id) || null;
  const selectedSubModule = selectedSubModuleId ? getSubModuleById(selectedSubModuleId) : null;
  const selectedSubModuleProgress = courseSummary?.subModules.find((item) => item.id === selectedSubModuleId) || null;
  const nextLesson = courseSummary?.subModules.find((item) => item.status === 'in_progress');
  const completedLessons = courseSummary?.completedSubModules || 0;
  const totalLessons = courseSummary?.totalSubModules || course.subModules.length;
  const percentComplete = courseSummary?.percentComplete || 0;
  const courseStatus = courseSummary?.status === 'passed' ? 'Passed' : nextLesson ? 'In progress' : 'Ready';
  const lessonSummary = `${completedLessons}/${totalLessons} ${lessonWord(totalLessons)} passed`;
  const selectedLessonNumber = selectedSubModuleProgress?.order || selectedSubModule?.order || null;
  const selectedLessonState = selectedSubModuleProgress ? getLessonStatusLabel(selectedSubModuleProgress.status) : null;
  const selectedLessonAccordionLabel = accordionStatusLabel(selectedSubModuleProgress?.status);

  const renderSummaryCards = () => (
    <>
      <article className={`${styles.summaryStatCard} ${styles.summaryStatCardFeature}`}>
        <div className={styles.summaryStatHeader}>
          <div>
            <p className={styles.kpiLabel}>Classroom progress</p>
            <p className={styles.kpiValue}>{lessonSummary}</p>
          </div>
          <span className={styles.pointsBadge}>{percentComplete}%</span>
        </div>
        <p className={styles.sectionHint}>Move through the lessons in order and your saved progress will stay with you.</p>
        {nextLesson ? (
          <button type="button" className={styles.primaryButton} onClick={() => setSelectedSubModuleId(nextLesson.id)}>
            Resume current lesson
          </button>
        ) : null}
      </article>

      <article className={styles.summaryStatCard}>
        <div className={styles.summaryStatHeader}>
          <div>
            <p className={styles.kpiLabel}>Workspace standing</p>
            <p className={styles.kpiValue}>{courseStatus}</p>
          </div>
          <span className={styles.pointsBadge}>{courseProgress?.totalPoints || 0} pts</span>
        </div>
        <p className={styles.sectionHint}>Your standing reflects lesson completion and course points inside the operator workspace.</p>
      </article>

      <article className={styles.summaryStatCard}>
        <div className={styles.summaryStatHeader}>
          <div>
            <p className={styles.kpiLabel}>Lessons passed</p>
            <p className={styles.kpiValue}>{completedLessons}</p>
          </div>
        </div>
        <p className={styles.sectionHint}>Complete each unlocked lesson to move the course forward and open the next step.</p>
      </article>

      <article className={styles.summaryStatCard}>
        <div className={styles.summaryStatHeader}>
          <div>
            <p className={styles.kpiLabel}>Current focus</p>
            <p className={styles.kpiValue}>{selectedLessonNumber ? `Lesson ${selectedLessonNumber}` : 'Choose a lesson'}</p>
          </div>
          {selectedLessonState ? <span className={styles.pointsBadge}>{selectedLessonState}</span> : null}
        </div>
        <p className={styles.sectionHint}>
          {selectedSubModule ? selectedSubModule.title : 'Open any unlocked lesson to begin this course.'}
        </p>
      </article>
    </>
  );

  const renderLessonQueue = () => (
    <>
      <div className={styles.railHeader}>
        <Link href="/courses" className={styles.backLink}>
          ← All Classrooms
        </Link>
        <h2 className={styles.railTitle}>Lesson queue</h2>
        <p className={styles.railDesc}>
          {course.subModules.length === 1
            ? 'Complete the orientation lesson to finish this course in one clean pass.'
            : 'Work through the lessons in order. Passed lessons stay recorded automatically.'}
        </p>
      </div>
      <div className={styles.lessonList}>
        {courseSummary?.subModules.map((sub) => {
          const isSelected = sub.id === selectedSubModuleId;
          const isLocked = sub.status === 'locked';
          const isPassed = sub.status === 'passed';
          const isCurrent = sub.status === 'in_progress';
          const status = isPassed ? 'Passed' : isCurrent ? 'Current' : 'Locked';

          return (
            <button
              key={sub.id}
              type="button"
              disabled={isLocked}
              onClick={() => setSelectedSubModuleId(sub.id)}
              className={`${styles.lessonItem} ${isSelected ? styles.lessonItemActive : ''} ${isLocked ? styles.lessonItemLocked : ''} ${
                isPassed ? styles.lessonItemPassed : ''
              } ${isCurrent ? styles.lessonItemCurrent : ''}`}
            >
              <span className={styles.lessonItemRow}>
                <span className={styles.lessonOrder}>Lesson {sub.order}</span>
                <span
                  className={`${styles.lessonStatus} ${isPassed ? styles.lessonStatusPassed : ''} ${
                    isCurrent ? styles.lessonStatusCurrent : ''
                  } ${isLocked ? styles.lessonStatusLocked : ''}`}
                >
                  {status}
                </span>
              </span>
              <span className={styles.lessonTitle}>{sub.title}</span>
            </button>
          );
        })}
      </div>
    </>
  );

  const renderLessonStage = () =>
    selectedSubModule && selectedSubModuleProgress ? (
      <QuizModule
        subModule={selectedSubModule}
        initialAnswers={selectedSubModuleProgress.draftAnswers}
        status={selectedSubModuleProgress.status}
        onUpdated={reload}
      />
    ) : (
      <section className={styles.codePanel}>
        <p className={styles.codeLabel}>Choose a lesson</p>
        <p className={styles.codeValue}>Open an unlocked lesson to continue this course inside your operator workspace.</p>
      </section>
    );

  const renderLeaderboard = () => (
    <>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sideTitleLike}>Leaderboard</h2>
          <p className={styles.sectionHint}>Course standings inside the operator workspace, ranked by points.</p>
        </div>
        <span className={styles.pointsBadge}>{courseProgress?.totalPoints || 0} pts</span>
      </div>
      <div className={styles.leaderboardGrid}>
        {leaderboard.slice(0, 6).map((entry) => (
          <article key={entry.email} className={`${styles.leaderboardItem} ${entry.isCurrentUser ? styles.leaderboardItemCurrent : ''}`}>
            <div className={styles.leaderboardRank}>#{entry.rank}</div>
            <div className={styles.leaderboardMeta}>
              <p className={styles.leaderboardName}>{entry.displayName}</p>
              <p className={styles.leaderboardStats}>{entry.points} pts</p>
            </div>
          </article>
        ))}
      </div>
    </>
  );

  return (
    <OnboardingLayout
      title={course.title}
      subtitle={course.description}
      progress={progress}
      courseProgress={courseProgress}
      loading={!ready}
    >
      {message ? <p className={`${styles.message} ${styles.messageError}`}>{message}</p> : null}

      <section className={`${styles.classroomHero} ${courseThemeClass(course.catalog.theme)}`}>
        <div className={styles.classroomHeroInner}>
          <div className={styles.classroomHeroContent}>
            <p className={styles.classroomEyebrow}>{course.divisionLabel}</p>
            <h2 className={styles.classroomHeroTitle}>{course.catalog.coverTitle}</h2>
            <p className={styles.classroomHeroText}>{course.catalog.summary}</p>
            <div className={styles.heroMetaRow}>
              <span className={styles.heroStatPill}>{lessonSummary}</span>
              <span className={styles.heroStatPill}>{percentComplete}% complete</span>
              {course.catalog.badge ? <span className={styles.heroStatPill}>{course.catalog.badge}</span> : null}
            </div>
          </div>
          <div className={styles.heroAside}>
            <div className={styles.heroProgressCard}>
              <div className={styles.heroProgressHeader}>
                <div>
                  <p className={styles.heroProgressLabel}>Course progress</p>
                  <p className={styles.heroProgressValue}>{lessonSummary}</p>
                </div>
                <span className={styles.heroProgressPercent}>{percentComplete}%</span>
              </div>
              <div className={styles.progressTrack}>
                <span className={styles.progressFill} style={{ width: `${percentComplete}%` }} />
              </div>
              <p className={styles.heroProgressHint}>Progress is saved as each lesson is completed.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.mobileOnly}>
        <article className={styles.currentLessonCard}>
          <div className={styles.currentLessonHeader}>
            <div>
              <p className={styles.kpiLabel}>Current lesson</p>
              <p className={styles.kpiValue}>{selectedLessonNumber ? `Lesson ${selectedLessonNumber}` : 'Choose a lesson'}</p>
            </div>
            <span className={styles.pointsBadge}>{selectedLessonAccordionLabel}</span>
          </div>
          <p className={styles.sectionHint}>
            {selectedSubModule ? selectedSubModule.title : 'Open an unlocked lesson to start the classroom.'}
          </p>
        </article>

        <section className={styles.mobileLessonStage}>{renderLessonStage()}</section>

        <details className={styles.mobileAccordion}>
          <summary className={styles.mobileAccordionSummary}>
            <span>
              <span className={styles.mobileAccordionEyebrow}>Navigate</span>
              <span className={styles.mobileAccordionTitle}>Lesson Queue</span>
            </span>
            <span className={styles.mobileAccordionMeta}>{lessonSummary}</span>
          </summary>
          <div className={styles.mobileAccordionContent}>
            <section className={styles.mobileAccordionPanel}>{renderLessonQueue()}</section>
          </div>
        </details>

        <details className={styles.mobileAccordion}>
          <summary className={styles.mobileAccordionSummary}>
            <span>
              <span className={styles.mobileAccordionEyebrow}>Progress</span>
              <span className={styles.mobileAccordionTitle}>Course Progress</span>
            </span>
            <span className={styles.mobileAccordionMeta}>{percentComplete}%</span>
          </summary>
          <div className={styles.mobileAccordionContent}>
            <section className={styles.mobileProgressStack}>{renderSummaryCards()}</section>
          </div>
        </details>

        <details className={styles.mobileAccordion}>
          <summary className={styles.mobileAccordionSummary}>
            <span>
              <span className={styles.mobileAccordionEyebrow}>Standings</span>
              <span className={styles.mobileAccordionTitle}>Leaderboard</span>
            </span>
            <span className={styles.mobileAccordionMeta}>{courseProgress?.totalPoints || 0} pts</span>
          </summary>
          <div className={styles.mobileAccordionContent}>
            <section className={styles.mobileAccordionPanel}>{renderLeaderboard()}</section>
          </div>
        </details>
      </section>

      <section className={`${styles.classroomSummaryStrip} ${styles.desktopOnly}`}>
        {renderSummaryCards()}
      </section>

      <section className={`${styles.classroomLayout} ${styles.desktopOnly}`}>
        <section className={styles.lessonRail}>
          {renderLessonQueue()}
        </section>

        <section className={styles.lessonStage}>{renderLessonStage()}</section>
      </section>

      <section className={`${styles.leaderboardPanel} ${styles.desktopOnly}`}>
        {renderLeaderboard()}
      </section>
    </OnboardingLayout>
  );
}

export default function ClassroomDetailPage() {
  return <AuthGate>{() => <ClassroomDetailContent />}</AuthGate>;
}
