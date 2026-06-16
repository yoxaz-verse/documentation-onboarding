import Link from 'next/link';
import { useEffect, useState } from 'react';
import ThemeToggle from '../components/theme/ThemeToggle';
import authStyles from '../components/AuthGate.module.css';
import OnboardingLayout from '../components/OnboardingLayout';
import styles from './onboarding.module.css';
import { isHttpError, isUnauthorizedError } from '../lib/http';
import { areCoursesUnlocked, getCompletedMilestoneCount, getNextMilestone, MILESTONES } from '../lib/onboarding';
import { getProgressBundle } from '../lib/progress';
import type { CourseProgressSummary, ProgressRecord, SessionUser } from '../lib/types';

type HomeState =
  | { status: 'loading' }
  | { status: 'signed_out' }
  | { status: 'error'; message: string }
  | { status: 'authenticated'; user: SessionUser };

type SessionPayload = {
  authenticated?: boolean;
  error?: string;
  user?: SessionUser;
};

type HomeContentProps = {
  user: SessionUser;
  onSessionExpired: () => void;
};

function SignedOutHome() {
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

        <h1 className={authStyles.heading}>Enter your operator workspace</h1>
        <p className={authStyles.message}>
          Sign in with your OTP to continue onboarding, manage your operator profile, and return to classroom courses from one workspace.
        </p>
        <Link href="/auth/login" className={styles.cta}>
          Enter workspace
        </Link>
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

function HomeContent({ user, onSessionExpired }: HomeContentProps) {
  const [progress, setProgress] = useState<ProgressRecord | null>(null);
  const [courseProgress, setCourseProgress] = useState<CourseProgressSummary | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const bundle = await getProgressBundle();
        if (!active) return;
        setProgress(bundle.progress);
        setCourseProgress(bundle.courseProgress);
        setMessage('');
      } catch (error) {
        if (!active) return;
        if (isUnauthorizedError(error)) {
          onSessionExpired();
          return;
        }

        setMessage(error instanceof Error ? error.message : 'Failed to load onboarding progress.');
      } finally {
        if (active) setLoadingProgress(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [onSessionExpired]);

  const nextMilestone = getNextMilestone(progress);
  const completedMilestones = getCompletedMilestoneCount(progress);
  const remainingMilestones = Math.max(MILESTONES.length - completedMilestones, 0);
  const coursesUnlocked = areCoursesUnlocked(progress);
  const nextActionHref = nextMilestone?.route || '/journey';
  const nextActionLabel = nextMilestone ? `Go to Step ${nextMilestone.number}` : 'Start operator journey';
  const nextActionTitle = nextMilestone ? `Step ${nextMilestone.number}: ${nextMilestone.label}` : 'Operator journey unlocked';
  const nextActionText = nextMilestone
    ? `Complete ${nextMilestone.label} next so the onboarding path keeps moving and the training library unlocks in order.`
    : 'Your required onboarding is complete, so you can begin Day 1, track daily milestones, and keep courses tied to real operator actions.';
  const nextActionReason = nextMilestone
    ? 'This page stays focused on the one step you need right now.'
    : 'Courses remain available, and the journey now gives them a daily operating path.';

  return (
    <OnboardingLayout
      title="Welcome back to your operator workspace"
      subtitle="Use this page to see the next required move and continue without extra distractions."
      progress={progress}
      courseProgress={courseProgress}
      loading={loadingProgress}
    >
      {loadingProgress ? (
        <p className={styles.message}>Loading workspace progress...</p>
      ) : (
        <>
      {message ? <p className={`${styles.message} ${styles.messageError}`}>{message}</p> : null}

      <section className={`${styles.callout} ${styles.homeHeroCard}`}>
        <div className={styles.homeHeroHeader}>
          <div>
            <p className={styles.homeHeroEyebrow}>Next required action</p>
            <h2 className={styles.homeHeroTitle}>{nextActionTitle}</h2>
          </div>
          <span className={styles.homeStatusPill}>{coursesUnlocked ? 'Training unlocked' : `${remainingMilestones} remaining`}</span>
        </div>
        <p className={styles.calloutText}>{nextActionText}</p>
        <div className={styles.homeActionRow}>
          <Link href={nextActionHref} className={styles.cta}>
            {nextActionLabel}
          </Link>
          <p className={styles.calloutHint}>{nextActionReason}</p>
        </div>
      </section>

      <section className={styles.homeProgressPanel} aria-label="Onboarding summary">
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
  const [state, setState] = useState<HomeState>({ status: 'loading' });

  useEffect(() => {
    let active = true;

    const loadSession = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
          cache: 'no-store',
        });
        const payload = (await response.json().catch(() => ({}))) as SessionPayload;
        if (!active) return;

        if (response.ok && payload.authenticated && payload.user) {
          setState({ status: 'authenticated', user: payload.user });
          return;
        }

        if (response.status === 401) {
          setState({ status: 'signed_out' });
          return;
        }

        setState({ status: 'error', message: payload.error || 'We could not load the home page right now. Please try again shortly.' });
      } catch (error) {
        if (!active) return;
        setState({
          status: 'error',
          message: isHttpError(error) ? error.message : 'We could not load the home page right now. Please try again shortly.',
        });
      }
    };

    loadSession();

    return () => {
      active = false;
    };
  }, []);

  if (state.status === 'loading') {
    return (
      <main className={authStyles.loadingPage}>
        <div className={authStyles.glowA} aria-hidden="true" />
        <div className={authStyles.glowB} aria-hidden="true" />
        <section className={authStyles.statusCard}>
          <div className={authStyles.statusRow}>
            <span className={authStyles.spinner} aria-hidden="true" />
            <h1 className={authStyles.heading}>Loading home</h1>
          </div>
          <p className={authStyles.message}>Checking your session and preparing the correct landing view...</p>
        </section>
      </main>
    );
  }

  if (state.status === 'signed_out') {
    return <SignedOutHome />;
  }

  if (state.status === 'error') {
    return <HomeError message={state.message} />;
  }

  return <HomeContent user={state.user} onSessionExpired={() => setState({ status: 'signed_out' })} />;
}
