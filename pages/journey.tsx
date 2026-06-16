import Link from 'next/link';
import { useEffect, useState } from 'react';
import AuthGate from '../components/AuthGate';
import OnboardingLayout from '../components/OnboardingLayout';
import { JOURNEY_TOTAL_DAYS, type JourneyMilestone } from '../config/operatorJourney';
import { isUnauthorizedError } from '../lib/http';
import { areCoursesUnlocked } from '../lib/onboarding';
import type { CourseProgressSummary, JourneyResponse, JourneySummary, ProgressRecord } from '../lib/types';
import styles from './onboarding.module.css';

type JourneyPageState =
  | { status: 'loading' }
  | { status: 'ready'; progress: ProgressRecord; courseProgress: CourseProgressSummary; journey: JourneySummary }
  | { status: 'error'; message: string };

function categoryLabel(category: JourneyMilestone['category']) {
  if (category === 'setup') return 'Setup';
  if (category === 'learning') return 'Learning';
  if (category === 'outreach') return 'Outreach';
  if (category === 'platform') return 'Platform';
  return 'Deal';
}

function clampTimelineDay(day: number | null) {
  if (!day) return 1;
  return Math.max(1, Math.min(JOURNEY_TOTAL_DAYS, day));
}

function JourneyContent() {
  const [state, setState] = useState<JourneyPageState>({ status: 'loading' });
  const [savingId, setSavingId] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    try {
      const response = await fetch('/api/journey', { credentials: 'include', cache: 'no-store' });
      const payload = (await response.json().catch(() => ({}))) as Partial<JourneyResponse> & { error?: string };

      if (!response.ok || !payload.progress || !payload.courseProgress || !payload.journey) {
        if (response.status === 401) {
          window.location.assign('/');
          return;
        }
        throw new Error(payload.error || 'Failed to load operator journey.');
      }

      if (!areCoursesUnlocked(payload.progress)) {
        window.location.assign('/step10');
        return;
      }

      setState({
        status: 'ready',
        progress: payload.progress,
        courseProgress: payload.courseProgress,
        journey: payload.journey,
      });
      setMessage('');
    } catch (error) {
      if (isUnauthorizedError(error)) {
        window.location.assign('/');
        return;
      }

      setState({ status: 'error', message: error instanceof Error ? error.message : 'Failed to load operator journey.' });
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleCheck = async (checkId: string, completed: boolean) => {
    setSavingId(checkId);
    setMessage('');
    try {
      const response = await fetch('/api/journey/checks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ checkId, completed }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || 'Failed to update checklist.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update checklist.');
    } finally {
      setSavingId('');
    }
  };

  const toggleMilestone = async (milestoneId: string, completed: boolean) => {
    setSavingId(milestoneId);
    setMessage('');
    try {
      const response = await fetch('/api/journey/milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ milestoneId, completed }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || 'Failed to update milestone.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update milestone.');
    } finally {
      setSavingId('');
    }
  };

  const startJourney = async () => {
    setSavingId('journey-start');
    setMessage('');
    try {
      const response = await fetch('/api/journey/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || 'Failed to start Day 1.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to start Day 1.');
    } finally {
      setSavingId('');
    }
  };

  if (state.status === 'loading') {
    return (
      <OnboardingLayout title="Operator Journey" subtitle="Loading your Day 1 path and milestone progress...">
        <p className={styles.message}>Loading journey...</p>
      </OnboardingLayout>
    );
  }

  if (state.status === 'error') {
    return (
      <OnboardingLayout title="Operator Journey" subtitle="Your journey is temporarily unavailable.">
        <p className={`${styles.message} ${styles.messageError}`}>{state.message}</p>
      </OnboardingLayout>
    );
  }

  const { progress, courseProgress, journey } = state;
  const completedCheckSet = new Set(journey.completedChecks);
  const completedMilestoneSet = new Set(journey.completedMilestones);
  const checksComplete = journey.completedCheckCount === journey.totalCheckCount;
  const currentDay = journey.currentDay;
  const visibleDay = clampTimelineDay(currentDay);
  const todaysMilestones = journey.milestones.filter((milestone) => milestone.day === visibleDay);
  const upcomingMilestone = journey.milestones.find((milestone) => milestone.day >= visibleDay && !completedMilestoneSet.has(milestone.id));
  const completionPercent = Math.round((journey.completedMilestoneCount / journey.totalMilestoneCount) * 100);
  const dayPercent = Math.round((Math.min(visibleDay, JOURNEY_TOTAL_DAYS) / JOURNEY_TOTAL_DAYS) * 100);

  const aside = (
    <section className={styles.sidebarPanel}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sideTitleLike}>Journey snapshot</h2>
          <p className={styles.sectionHint}>Your operator day count, course progress, and milestone completion in one place.</p>
        </div>
      </div>
      <div className={styles.journeyAsideStack}>
        <div className={styles.journeyAsideItem}>
          <span>Operator day</span>
          <strong>{currentDay ? `Day ${currentDay}` : 'Not started'}</strong>
        </div>
        <div className={styles.journeyAsideItem}>
          <span>Journey milestones</span>
          <strong>{journey.completedMilestoneCount}/{journey.totalMilestoneCount}</strong>
        </div>
        <div className={styles.journeyAsideItem}>
          <span>Lessons passed</span>
          <strong>{courseProgress.passedSubModules}/{courseProgress.totalSubModules}</strong>
        </div>
      </div>
    </section>
  );

  return (
    <OnboardingLayout
      title="Operator Journey"
      subtitle="Start Day 1 when your accounts are ready, then follow the daily operator path across courses, outreach, platform work, and deal readiness."
      progress={progress}
      courseProgress={courseProgress}
      aside={aside}
    >
      {message ? <p className={`${styles.message} ${styles.messageError}`}>{message}</p> : null}

      <section className={`${styles.callout} ${styles.journeyHero}`}>
        <div className={styles.homeHeroHeader}>
          <div>
            <p className={styles.homeHeroEyebrow}>Operator path</p>
            <h2 className={styles.homeHeroTitle}>{currentDay ? `Day ${currentDay}: stay on track` : 'Start your day as an operator'}</h2>
          </div>
          <span className={styles.homeStatusPill}>{currentDay ? `${completionPercent}% complete` : `${journey.completedCheckCount}/${journey.totalCheckCount} checks`}</span>
        </div>
        <p className={styles.calloutText}>
          {currentDay
            ? 'Use this timeline to keep your learning, relationship building, and deal preparation moving in the right order.'
            : 'Complete the required confirmation checklist, then start Day 1 to begin your relative 30-day operator milestone path.'}
        </p>
        <div className={styles.progressTrack} aria-hidden="true">
          <span className={styles.progressFill} style={{ width: `${currentDay ? completionPercent : Math.round((journey.completedCheckCount / journey.totalCheckCount) * 100)}%` }} />
        </div>
      </section>

      {!currentDay ? (
        <section className={styles.journeyStartGrid}>
          <div className={styles.journeyChecklist}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.courseCardTitle}>Preflight checklist</h2>
                <p className={styles.sectionHint}>Every item must be confirmed before the Day 1 counter can start.</p>
              </div>
              <span className={styles.pointsBadge}>{checksComplete ? 'Ready' : 'Required'}</span>
            </div>

            <div className={styles.journeyCheckList}>
              {journey.checks.map((check) => {
                const checked = completedCheckSet.has(check.id);
                return (
                  <label key={check.id} className={`${styles.journeyCheckItem} ${checked ? styles.journeyCheckItemDone : ''}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={savingId === check.id}
                      onChange={(event) => toggleCheck(check.id, event.target.checked)}
                    />
                    <span>
                      <strong>{check.label}</strong>
                      <small>{check.description}</small>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <aside className={styles.journeyStartPanel}>
            <p className={styles.kpiLabel}>Start condition</p>
            <p className={styles.kpiValue}>{checksComplete ? 'Ready for Day 1' : 'Finish checklist'}</p>
            <p className={styles.sectionHint}>
              Your Day 1 count begins only once. After it starts, the calendar is based on the start timestamp and milestones can be completed as you work.
            </p>
            <button type="button" className={styles.primaryButton} disabled={!checksComplete || savingId === 'journey-start'} onClick={startJourney}>
              {savingId === 'journey-start' ? 'Starting...' : 'Start Day 1'}
            </button>
          </aside>
        </section>
      ) : (
        <>
          <section className={styles.journeyStatsGrid}>
            <article className={styles.kpiCard}>
              <p className={styles.kpiLabel}>Current operator day</p>
              <p className={styles.kpiValue}>Day {currentDay}</p>
            </article>
            <article className={styles.kpiCard}>
              <p className={styles.kpiLabel}>30-day path</p>
              <p className={styles.kpiValue}>{dayPercent}% elapsed</p>
            </article>
            <article className={styles.kpiCard}>
              <p className={styles.kpiLabel}>Milestones done</p>
              <p className={styles.kpiValue}>{journey.completedMilestoneCount}/{journey.totalMilestoneCount}</p>
            </article>
            <article className={styles.kpiCard}>
              <p className={styles.kpiLabel}>Course progress</p>
              <p className={styles.kpiValue}>{courseProgress.overallPercent}%</p>
            </article>
          </section>

          <section className={styles.journeyTodayPanel}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.courseCardTitle}>Today's operator focus</h2>
                <p className={styles.sectionHint}>{upcomingMilestone ? upcomingMilestone.title : 'All journey milestones are complete.'}</p>
              </div>
              <span className={styles.pointsBadge}>Day {visibleDay}</span>
            </div>
            <div className={styles.journeyMilestoneGrid}>
              {(todaysMilestones.length ? todaysMilestones : journey.milestones.slice(Math.max(0, visibleDay - 1), visibleDay + 2)).map((milestone) => {
                const completed = completedMilestoneSet.has(milestone.id);
                return (
                  <article key={milestone.id} className={`${styles.journeyMilestoneCard} ${completed ? styles.journeyMilestoneCardDone : ''}`}>
                    <div className={styles.journeyMilestoneHeader}>
                      <span className={styles.journeyDayBadge}>Day {milestone.day}</span>
                      <span className={styles.courseBadge}>{categoryLabel(milestone.category)}</span>
                    </div>
                    <h3 className={styles.journeyMilestoneTitle}>{milestone.title}</h3>
                    <p className={styles.sectionHint}>{milestone.description}</p>
                    <div className={styles.cardActions}>
                      <button
                        type="button"
                        className={completed ? styles.secondaryButton : styles.primaryButton}
                        disabled={savingId === milestone.id}
                        onClick={() => toggleMilestone(milestone.id, !completed)}
                      >
                        {savingId === milestone.id ? 'Saving...' : completed ? 'Mark open' : 'Mark complete'}
                      </button>
                      {milestone.href ? (
                        <Link href={milestone.href} className={styles.inlineLink}>
                          {milestone.actionLabel || 'Open'}
                        </Link>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className={styles.journeyTimelinePanel} aria-label="30-day journey timeline">
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.courseCardTitle}>30-day milestone calendar</h2>
                <p className={styles.sectionHint}>Each day stays visible so operators can see whether they are ahead, current, or catching up.</p>
              </div>
            </div>
            <div className={styles.journeyTimelineGrid}>
              {journey.milestones.map((milestone) => {
                const completed = completedMilestoneSet.has(milestone.id);
                const isToday = milestone.day === visibleDay;
                const isPast = milestone.day < visibleDay;
                const className = `${styles.journeyTimelineItem} ${completed ? styles.journeyTimelineItemDone : ''} ${
                  isToday ? styles.journeyTimelineItemToday : ''
                } ${isPast && !completed ? styles.journeyTimelineItemDue : ''}`;

                return (
                  <button
                    key={milestone.id}
                    type="button"
                    className={className}
                    disabled={savingId === milestone.id}
                    onClick={() => toggleMilestone(milestone.id, !completed)}
                    title={milestone.title}
                  >
                    <span>Day {milestone.day}</span>
                    <strong>{completed ? 'Done' : isToday ? 'Today' : isPast ? 'Due' : 'Next'}</strong>
                  </button>
                );
              })}
            </div>
          </section>
        </>
      )}
    </OnboardingLayout>
  );
}

export default function JourneyPage() {
  return <AuthGate>{() => <JourneyContent />}</AuthGate>;
}
