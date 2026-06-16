import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState, type ReactNode } from 'react';
import { areCoursesUnlocked, canAccessStep, getCompletedMilestoneCount, isMilestoneCompleted, MILESTONES, type MilestoneNumber } from '../lib/onboarding';
import type { CourseProgressSummary, ProgressRecord } from '../lib/types';
import ThemeToggle from './theme/ThemeToggle';
import styles from './OnboardingLayout.module.css';

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  progress?: ProgressRecord | null;
  courseProgress?: CourseProgressSummary | null;
  aside?: ReactNode;
  loading?: boolean;
};

type StepDef = {
  key: 'home' | MilestoneNumber;
  label: string;
  href: string;
  state: string;
};

type MobileTabIcon = 'home' | 'steps' | 'journey' | 'courses' | 'profile';

type MobileTabDef = {
  key: 'home' | 'steps' | 'journey' | 'courses' | 'profile';
  label: string;
  href: string;
  active: boolean;
  meta: string;
  icon: MobileTabIcon;
};

const SIDEBAR_STORAGE_KEY = 'obaol:onboarding-sidebar-collapsed';

function getCourseStatusLabel(status: 'locked' | 'in_progress' | 'passed') {
  if (status === 'passed') return 'Passed';
  if (status === 'in_progress') return 'In progress';
  return 'Ready';
}

function CompletionChip({ label = 'Completed' }: { label?: string }) {
  return <span className={styles.completionChip}>{label}</span>;
}

function MobileTabIconGlyph({ icon }: { icon: MobileTabIcon }) {
  if (icon === 'home') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5.5 9.5V20a1 1 0 0 0 1 1H10v-6h4v6h3.5a1 1 0 0 0 1-1V9.5" />
      </svg>
    );
  }

  if (icon === 'steps') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 6h10" />
        <path d="M9 12h10" />
        <path d="M9 18h10" />
        <path d="m5 6 1.2 1.2L8.5 5" />
        <path d="m5 12 1.2 1.2L8.5 11" />
        <path d="m5 18 1.2 1.2L8.5 17" />
      </svg>
    );
  }

  if (icon === 'courses') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4.5 5.5A2.5 2.5 0 0 1 7 3h11v15H7a2.5 2.5 0 0 0-2.5 2.5" />
        <path d="M7 3a2.5 2.5 0 0 0-2.5 2.5V21" />
        <path d="M9 7h6" />
        <path d="M9 11h6" />
      </svg>
    );
  }

  if (icon === 'journey') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 19V5" />
        <path d="M4 7h11l-1.5 3L15 13H4" />
        <path d="M7 19h13" />
        <path d="M16 16l2 3 2-3" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 21a7 7 0 0 0-14 0" />
      <circle cx="12" cy="8" r="4" />
    </svg>
  );
}

export default function OnboardingLayout({ title, subtitle, children, progress, courseProgress, aside, loading = false }: Props) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const inClassroom = router.pathname === '/courses' || router.pathname.startsWith('/courses/');
  const inJourney = router.pathname === '/journey';
  const inProfile = router.pathname === '/profile';
  const activeStep = MILESTONES.find((milestone) => router.pathname === milestone.route) || null;
  const coursesUnlocked = loading ? false : areCoursesUnlocked(progress ?? null);
  const completedSteps = loading ? 0 : getCompletedMilestoneCount(progress ?? null);
  const totalCourses = courseProgress?.totalCourses || 0;
  const passedCourses = courseProgress?.passedCourses || 0;
  const nextMilestone = loading ? null : MILESTONES.find((milestone) => canAccessStep(progress ?? null, milestone.number) && !isMilestoneCompleted(progress, milestone.number)) || null;

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // Best-effort sign-out; still route home to avoid trapping users.
    } finally {
      window.location.assign('/');
    }
  };

  const stepDefs: StepDef[] = [
    { key: 'home', label: 'Home', href: '/', state: 'Overview' },
    ...MILESTONES.map((milestone) => ({
      key: milestone.number,
      label: `Step ${milestone.number}`,
      href: milestone.route,
      state: isMilestoneCompleted(progress, milestone.number) ? 'Done' : milestone.shortLabel,
    })),
  ];

  const onboardingSummary = `${completedSteps}/${MILESTONES.length} milestones completed`;
  const classroomSummary = coursesUnlocked ? `${passedCourses}/${totalCourses} training tracks completed` : 'Locked until onboarding is done';
  const trainingLockSummary = coursesUnlocked ? 'Training library unlocked' : nextMilestone ? `Complete Step ${nextMilestone.number} to keep unlocking access` : 'Finish guided onboarding to unlock training';
  const mobileStepHref = activeStep?.route || nextMilestone?.route || MILESTONES[MILESTONES.length - 1]?.route || '/step10';
  const mobileStepLabel = activeStep ? `Step ${activeStep.number}` : 'Steps';
  const mobileTabs: MobileTabDef[] = [
    { key: 'home', label: 'Home', href: '/', active: router.pathname === '/', meta: 'Workspace', icon: 'home' },
    { key: 'steps', label: mobileStepLabel, href: mobileStepHref, active: Boolean(activeStep), meta: activeStep ? activeStep.shortLabel : nextMilestone ? 'Continue' : 'Complete', icon: 'steps' },
    { key: 'journey', label: 'Journey', href: '/journey', active: inJourney, meta: coursesUnlocked ? 'Day path' : 'Locked', icon: 'journey' },
    { key: 'courses', label: 'Courses', href: '/courses', active: inClassroom, meta: coursesUnlocked ? 'Library' : 'Locked', icon: 'courses' },
    { key: 'profile', label: 'Profile', href: '/profile', active: inProfile, meta: 'Account', icon: 'profile' },
  ];

  useEffect(() => {
    try {
      setSidebarCollapsed(window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true');
    } catch {
      setSidebarCollapsed(false);
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch {
        // Non-critical preference; keep the in-memory state even if storage is unavailable.
      }
      return next;
    });
  };

  return (
    <main className={styles.shell}>
      <div className={styles.container}>
        <section className={`${styles.layout} ${sidebarCollapsed ? styles.layoutCollapsed : ''}`}>
          <nav className={`${styles.nav} ${sidebarCollapsed ? styles.navCollapsed : ''}`} aria-label="Onboarding and courses">
            <div className={styles.sidebarHeader}>
              <Link href="/" className={styles.sidebarBrand} aria-label="OBAOL Operator Workspace home">
                <span className={styles.brandMark}>OB</span>
                <span className={styles.brandText}>
                  <span className={styles.brandName}>OBAOL</span>
                  <span className={styles.brandSubline}>Operator workspace</span>
                </span>
              </Link>
              <button
                type="button"
                className={styles.sidebarToggle}
                onClick={toggleSidebar}
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d={sidebarCollapsed ? 'm9 6 6 6-6 6' : 'm15 6-6 6 6 6'} />
                </svg>
              </button>
            </div>

            {loading ? (
              <>
                <span className={styles.navGroupTitle}>Workspace</span>
                <div className={`${styles.navItem} ${styles.navLoadingItem}`}>
                  <span className={styles.navDot} aria-hidden="true" />
                  <span className={styles.navTitle}>Loading workspace...</span>
                  <span className={styles.navStateRow}>
                    <span className={styles.navState}>Checking progress</span>
                  </span>
                </div>
                <div className={`${styles.navItem} ${styles.navLoadingItem}`}>
                  <span className={styles.navDot} aria-hidden="true" />
                  <span className={styles.navTitle}>Loading journey...</span>
                  <span className={styles.navStateRow}>
                    <span className={styles.navState}>Preparing daily path</span>
                  </span>
                </div>
                <p className={styles.navGroupTitle}>Onboarding</p>
                {Array.from({ length: 5 }, (_, index) => (
                  <div key={index} className={`${styles.navItem} ${styles.navLoadingItem}`}>
                    <span className={styles.navDot} aria-hidden="true" />
                    <span className={styles.navTitle}>Loading step</span>
                    <span className={styles.navStateRow}>
                      <span className={styles.navState}>Please wait</span>
                    </span>
                  </div>
                ))}
              </>
            ) : (
              <>
                <span className={styles.navGroupTitle}>Momentum</span>
                <div className={styles.navItem}>
                  <span className={styles.navDot} aria-hidden="true" />
                  <span className={styles.navTitle}>Onboarding status</span>
                  <span className={styles.navStateRow}>
                    <span className={styles.navState}>{onboardingSummary}</span>
                    {completedSteps === MILESTONES.length ? <CompletionChip label="Ready" /> : null}
                  </span>
                </div>
                <div className={styles.navItem}>
                  <span className={styles.navDot} aria-hidden="true" />
                  <span className={styles.navTitle}>Course progress</span>
                  <span className={styles.navStateRow}>
                    <span className={styles.navState}>{coursesUnlocked ? classroomSummary : trainingLockSummary}</span>
                  </span>
                </div>
                <p className={styles.navGroupTitle}>Onboarding</p>
                {stepDefs.map((step) => {
              const isActive = router.pathname === step.href;
              const isDone = typeof step.key === 'number' && isMilestoneCompleted(progress, step.key);
              const isEnabled = step.key === 'home' || (typeof step.key === 'number' && canAccessStep(progress ?? null, step.key));
              const stateLabel = isActive ? 'Current' : isEnabled ? step.state : 'Locked';
              const className = `${styles.navItem} ${isActive ? styles.navActive : ''} ${isDone ? styles.navDone : ''} ${
                !isEnabled ? styles.navDisabled : ''
              }`;

              if (!isEnabled) {
                return (
                  <span key={step.href} className={className} aria-disabled="true" title={step.label}>
                    <span className={styles.navDot} aria-hidden="true" />
                    <span className={styles.navTitle}>{step.label}</span>
                    <span className={styles.navStateRow}>
                      <span className={styles.navState}>{stateLabel}</span>
                    </span>
                  </span>
                );
              }

              return (
                <Link key={step.href} href={step.href} className={className} title={step.label} aria-current={isActive ? 'page' : undefined}>
                  <span className={styles.navDot} aria-hidden="true" />
                  <span className={styles.navTitle}>
                    {step.label}
                    {typeof step.key === 'number' ? ` · ${MILESTONES[step.key - 1]?.shortLabel || ''}` : ''}
                  </span>
                  <span className={styles.navStateRow}>
                    <span className={styles.navState}>{stateLabel}</span>
                    {isDone ? <CompletionChip /> : null}
                    {isActive ? <span className={styles.navChip}>Now</span> : null}
                  </span>
                </Link>
              );
                })}

                <p className={styles.navGroupTitle}>Classroom</p>
                {coursesUnlocked ? (
                  <>
                    <Link href="/journey" className={`${styles.navItem} ${inJourney ? styles.navActive : ''}`}>
                      <span className={styles.navDot} aria-hidden="true" />
                      <span className={styles.navTitle}>Operator Journey</span>
                      <span className={styles.navStateRow}>
                        <span className={styles.navState}>30-day milestone path</span>
                        {inJourney ? <span className={styles.navChip}>Now</span> : null}
                      </span>
                    </Link>
                    <Link href="/courses" className={`${styles.navItem} ${inClassroom ? styles.navActive : ''}`}>
                      <span className={styles.navDot} aria-hidden="true" />
                      <span className={styles.navTitle}>Operator Training Library</span>
                      <span className={styles.navStateRow}>
                        <span className={styles.navState}>Unlocked</span>
                        {inClassroom ? <span className={styles.navChip}>Now</span> : null}
                      </span>
                    </Link>
                    <p className={styles.navSubgroupTitle}>Classrooms</p>
                    {(courseProgress?.courses || []).map((course) => (
                      <Link
                        key={course.id}
                        href={`/courses/${course.id}`}
                        className={`${styles.navItem} ${course.status === 'passed' ? styles.navDone : ''} ${router.asPath === `/courses/${course.id}` ? styles.navActive : ''}`}
                        title={course.title}
                      >
                        <span className={styles.navDot} aria-hidden="true" />
                        <span className={styles.navTitle}>{course.title}</span>
                        <span className={styles.navStateRow}>
                          <span className={styles.navState}>
                            {course.completedSubModules}/{course.totalSubModules} lessons · {getCourseStatusLabel(course.status)}
                          </span>
                          {course.status === 'passed' ? <CompletionChip /> : null}
                        </span>
                      </Link>
                    ))}
                  </>
                ) : (
                  <>
                    <span className={`${styles.navItem} ${styles.navDisabled}`} aria-disabled="true">
                      <span className={styles.navDot} aria-hidden="true" />
                      <span className={styles.navTitle}>Operator Journey</span>
                      <span className={styles.navStateRow}>
                        <span className={styles.navState}>Locked until onboarding is done</span>
                      </span>
                    </span>
                    <span className={`${styles.navItem} ${styles.navDisabled}`} aria-disabled="true">
                      <span className={styles.navDot} aria-hidden="true" />
                      <span className={styles.navTitle}>Operator Training Library</span>
                      <span className={styles.navStateRow}>
                        <span className={styles.navState}>Locked until Step 10</span>
                      </span>
                    </span>
                  </>
                )}
              </>
            )}
          </nav>

          <article className={styles.mainCard}>
            <header className={styles.workspaceHeader}>
              <div className={styles.workspaceTitleBlock}>
                <p className={styles.workspaceEyebrow}>Operator workspace</p>
                <h1 className={styles.heading}>{title}</h1>
                {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
              </div>
              <div className={styles.topBarActions}>
                <Link href="/profile" className={`${styles.profileLink} ${styles.desktopAction} ${router.pathname === '/profile' ? styles.profileLinkActive : ''}`}>
                  Profile
                </Link>
                <button type="button" className={`${styles.logoutButton} ${styles.desktopAction}`} onClick={handleLogout} disabled={loggingOut}>
                  {loggingOut ? 'Logging out...' : 'Log out'}
                </button>
                <div className={styles.desktopAction}>
                  <ThemeToggle size="sm" variant="surface" />
                </div>
              </div>
            </header>
            <div className={styles.content}>{children}</div>
            <section className={styles.supportingSection}>
              <div className={styles.supportingInner}>
                {loading ? (
                  <>
                    <h2 className={styles.sideTitle}>Loading workspace</h2>
                    <p className={styles.sideSubtitle}>Preparing your progress and journey details...</p>
                    <ul className={styles.sideList}>
                      {Array.from({ length: 3 }, (_, index) => (
                        <li key={index} className={`${styles.sideItem} ${styles.sideItemLoading}`}>
                          <span className={styles.sideItemHeader}>
                            <span className={styles.sideItemTitle}>Loading item</span>
                          </span>
                          <span className={styles.sideItemStatus}>Please wait</span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : aside ?? (
                  <>
                    <h2 className={styles.sideTitle}>{coursesUnlocked ? 'Training Library' : 'Guided Onboarding'}</h2>
                    <p className={styles.sideSubtitle}>
                      {coursesUnlocked
                        ? 'Access operator-specific courses inside your workspace and return to saved lessons anytime.'
                        : 'Courses stay locked until the full pre-course onboarding sequence is completed.'}
                    </p>
                    <ul className={styles.sideList}>
                      {coursesUnlocked
                        ? (courseProgress?.courses || []).map((course) => (
                            <li key={course.id} className={`${styles.sideItem} ${course.status === 'passed' ? styles.sideItemDone : ''}`}>
                              <span className={styles.sideItemHeader}>
                                <span className={styles.sideItemTitle}>{course.title}</span>
                                {course.status === 'passed' ? <CompletionChip /> : null}
                              </span>
                              <span className={styles.sideItemStatus}>
                                {course.completedSubModules}/{course.totalSubModules} lessons · {getCourseStatusLabel(course.status)}
                              </span>
                            </li>
                          ))
                        : MILESTONES.map((milestone) => (
                            <li key={milestone.number} className={`${styles.sideItem} ${isMilestoneCompleted(progress, milestone.number) ? styles.sideItemDone : ''}`}>
                              <span className={styles.sideItemHeader}>
                                <span className={styles.sideItemTitle}>Step {milestone.number}: {milestone.shortLabel}</span>
                                {isMilestoneCompleted(progress, milestone.number) ? <CompletionChip /> : null}
                              </span>
                              <span className={styles.sideItemStatus}>{milestone.summary}</span>
                            </li>
                          ))}
                    </ul>
                  </>
                )}
              </div>
            </section>
          </article>
        </section>
      </div>

      <nav className={styles.mobileBottomNav} aria-label="Mobile workspace navigation">
        {mobileTabs.map((tab) => (
          <Link key={tab.key} href={tab.href} className={`${styles.mobileBottomNavItem} ${tab.active ? styles.mobileBottomNavItemActive : ''}`} aria-current={tab.active ? 'page' : undefined}>
            <span className={styles.mobileBottomNavIcon}>
              <MobileTabIconGlyph icon={tab.icon} />
            </span>
            <span className={styles.mobileBottomNavLabel}>{tab.label}</span>
            <span className={styles.mobileBottomNavMeta}>{tab.meta}</span>
          </Link>
        ))}
      </nav>
    </main>
  );
}
