import Link from 'next/link';
import { useEffect } from 'react';
import ThemeToggle from '../components/theme/ThemeToggle';
import authStyles from '../components/AuthGate.module.css';
import OnboardingLayout from '../components/OnboardingLayout';
import LoadingState from '../components/LoadingState';
import styles from './onboarding.module.css';
import { areCoursesUnlocked, getCompletedMilestoneCount, getNextMilestone, MILESTONES } from '../lib/onboarding';
import { isUnauthorizedError } from '../lib/http';
import { useWorkspace } from '../hooks/useWorkspace';
import type { CourseProgressSummary, ProgressRecord, SessionUser } from '../lib/types';
import { trackFunnelEvent } from '../lib/clientFunnel';

type HomeContentProps = {
  user: SessionUser;
};

function SignedOutHome() {
  useEffect(() => {
    trackFunnelEvent('landing_view');
  }, []);

  return (
    <main className={authStyles.loadingPage}>
      <div className={authStyles.glowA} aria-hidden="true" />
      <div className={authStyles.glowB} aria-hidden="true" />
      <section className={authStyles.statusCard}>
        <div className={authStyles.themeToggleWrapper}>
          <ThemeToggle size="sm" variant="surface" />
        </div>

        <div className={authStyles.logoContainer}>
          <div className={authStyles.logoBadge}>
            <svg className={authStyles.logoSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className={authStyles.logoText}>OBAOL Operator Program</span>
        </div>

        <h1 className={authStyles.heading}>Learn how to become a successful OBAOL operator</h1>
        <p className={authStyles.message}>
          A guided program for invited operators: complete Getting Started, learn through operator-specific training courses, then apply your skills in the practical 30-level Operator Journey.
        </p>
        <ol className={authStyles.programStages} aria-label="Operator program stages">
          <li><strong>1. Getting Started</strong><span>Understand the model and complete required setup.</span></li>
          <li><strong>2. Training Courses</strong><span>Build the knowledge required to operate confidently.</span></li>
          <li><strong>3. Practical Operator Journey</strong><span>Apply the learning through 30 guided levels.</span></li>
        </ol>
        <Link href="/auth/login" className={styles.cta} onClick={() => trackFunnelEvent('getting_started_cta_clicked')}>
          Start Getting Started
        </Link>
        <p className={authStyles.invitationHint}>Returning operator? Use the same button to continue. Have your invitation email ready.</p>
      </section>
    </main>
  );
}

function HomeError({ message }: { message: string }) {
  return (
    <main className={authStyles.loadingPage}>
      <div className={authStyles.glowA} aria-hidden="true" />
      <div className={authStyles.glowB} aria-hidden="true" />
      <section className={authStyles.statusCard}>
        <div className={authStyles.themeToggleWrapper}>
          <ThemeToggle size="sm" variant="surface" />
        </div>

        <div className={authStyles.logoContainer}>
          <div className={authStyles.logoBadge}>
            <svg className={authStyles.logoSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className={authStyles.logoText}>OBAOL Workspace</span>
        </div>

        <h1 className={authStyles.heading}>Your workspace is temporarily unavailable</h1>
        <p className={authStyles.message}>{message}</p>
        <Link href="/auth/login" className={styles.cta}>
          Go to login
        </Link>
      </section>
    </main>
  );
}

function HomeContent({ user, progress, courseProgress }: HomeContentProps & { progress: ProgressRecord; courseProgress: CourseProgressSummary }) {
  const loadingProgress = false;
  const message = '';

  const nextMilestone = getNextMilestone(progress);
  const completedMilestones = getCompletedMilestoneCount(progress);
  const remainingMilestones = Math.max(MILESTONES.length - completedMilestones, 0);
  const coursesUnlocked = areCoursesUnlocked(progress);
  const nextActionHref = nextMilestone?.route || '/journey';
  const nextActionLabel = nextMilestone ? `Go to Step ${nextMilestone.number}` : 'Start operator journey';
  const nextActionTitle = nextMilestone ? `Step ${nextMilestone.number}: ${nextMilestone.label}` : 'Operator journey unlocked';
  const nextActionText = nextMilestone
    ? `Complete ${nextMilestone.label} next to continue Getting Started and unlock the Training Courses in order.`
    : 'Getting Started is complete. Continue with Training Courses and apply your learning in the Practical Operator Journey.';
  const nextActionReason = nextMilestone
    ? 'This page stays focused on the one step you need right now.'
    : 'Courses remain available, and the journey now gives them a guided operating path.';

  return (
    <OnboardingLayout
      title="Welcome back to your operator workspace"
      subtitle="Follow one clear path: Getting Started, Training Courses, then the Practical Operator Journey."
      progress={progress}
      courseProgress={courseProgress}
      loading={loadingProgress}
    >
      {loadingProgress ? (
        <LoadingState title="Preparing your dashboard" message="Loading workspace progress and your next required action…" preset="metrics" />
      ) : (
        <>
      {message ? <p className={`${styles.message} ${styles.messageError}`}>{message}</p> : null}

      <section className={styles.homeProgressPanel} aria-label="Operator program roadmap">
        <div className={styles.homeSummaryGrid}>
          <span>1. Getting Started</span>
          <span>2. Training Courses</span>
          <span>3. Practical Operator Journey</span>
        </div>
      </section>

      <section className={`${styles.callout} ${styles.homeHeroCard}`}>
        <div className={styles.homeHeroHeader}>
          <div>
            <p className={styles.homeHeroEyebrow}>Next required action</p>
            <h2 className={styles.homeHeroTitle}>{nextActionTitle}</h2>
          </div>
          <span className={styles.homeStatusPill}>{coursesUnlocked ? 'Training unlocked' : `${remainingMilestones} remaining`}</span>
        </div>
        <p className={styles.calloutText}>{nextActionText}</p>
        <div className={styles.homeCommandStats} aria-label="Workspace status">
          <span>
            <strong>{completedMilestones}</strong>
            <small>Completed</small>
          </span>
          <span>
            <strong>{remainingMilestones}</strong>
            <small>Remaining</small>
          </span>
          <span>
            <strong>{coursesUnlocked ? 'Open' : `Step ${nextMilestone?.number || 1}`}</strong>
            <small>{coursesUnlocked ? 'Training' : 'Next unlock'}</small>
          </span>
        </div>
        <div className={styles.homeActionRow}>
          <Link href={nextActionHref} className={styles.cta}>
            {nextActionLabel}
          </Link>
          <p className={styles.calloutHint}>{nextActionReason}</p>
        </div>
      </section>

      <section className={styles.homeProgressPanel} aria-label="Getting Started summary">
        <div className={styles.homeProgressMeta}>
          <p className={styles.homeIdentityText}>
            Signed in as <strong>{user.email}</strong>
          </p>
          <p className={styles.homeHeroProgress}>
            {completedMilestones}/{MILESTONES.length} checkpoints complete
          </p>
        </div>
        <div className={styles.progressTrack} aria-hidden="true">
          <span className={styles.progressFill} style={{ width: `${(completedMilestones / MILESTONES.length) * 100}%` }} />
        </div>
        <div className={styles.homeSummaryGrid}>
          <span>Completed: {completedMilestones}</span>
          <span>Next: {nextMilestone ? `Step ${nextMilestone.number}` : 'Journey'}</span>
          <span>Remaining: {remainingMilestones}</span>
        </div>
      </section>
        </>
      )}
    </OnboardingLayout>
  );
}

export default function HomePage() {
  const { data, error, loading } = useWorkspace({ redirectOnUnauthorized: false });

  if (loading) {
    return <LoadingState variant="page" title="Loading home" message="Checking your session and preparing the correct landing view…" />;
  }

  if (isUnauthorizedError(error)) {
    return <SignedOutHome />;
  }

  if (error || !data) {
    return <HomeError message={error?.message || 'We could not load the home page right now. Please try again shortly.'} />;
  }

  return <HomeContent user={data.user} progress={data.progress} courseProgress={data.courseProgress} />;
}
