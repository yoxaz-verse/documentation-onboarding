import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import type { MouseEvent, SyntheticEvent } from 'react';
import AdminGate from '../../../components/AdminGate';
import LoadingState from '../../../components/LoadingState';
import ThemeToggle from '../../../components/theme/ThemeToggle';
import type { AdminOperatorDetail } from '../../../lib/adminTypes';
import styles from '../admin.module.css';

function formatDate(value: string | null) {
  if (!value) return 'N/A';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleString();
}

function titleCase(value: string) {
  return value.split(/[_\s-]+/).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return 'Not provided';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.map(displayValue).join(', ');
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

function badgeClass(status: string) {
  return ['complete', 'completed', 'passed'].includes(status) ? styles.badgeDone : styles.badgePending;
}

type DetailSection = 'onboarding' | 'courses' | 'journey';

function DetailContent() {
  const router = useRouter();
  const email = String(router.query.email || '').trim().toLowerCase();
  const [detail, setDetail] = useState<AdminOperatorDetail | null>(null);
  const [error, setError] = useState('');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    onboarding: false,
    courses: false,
    journey: false,
  });

  useEffect(() => {
    if (!email || !email.includes('@')) return;
    const load = async () => {
      setError('');
      const response = await fetch(`/api/admin/operators/${encodeURIComponent(email)}`, { credentials: 'include', cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) return setError(payload?.error || 'Failed to load operator detail.');
      setDetail(payload.detail || null);
    };
    load();
  }, [email]);

  const stats = useMemo(() => detail ? [
    { label: 'Onboarding', value: `${detail.progress?.completedMilestones || 0}/${detail.summary.totalOnboardingSteps}` },
    { label: 'Courses', value: `${detail.summary.completedCourses}/${detail.summary.totalCourses}` },
    { label: 'Lessons', value: `${detail.summary.completedLessons}/${detail.summary.totalLessons}` },
    { label: 'Journey days', value: `${detail.summary.completedJourneyDays}/${detail.summary.totalJourneyDays}` },
    { label: 'Pending reviews', value: String(detail.summary.pendingJourneyReviews) },
    { label: 'Latest activity', value: formatDate(detail.summary.latestActivityAt) },
  ] : [], [detail]);

  const navigateToSection = (event: MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    event.preventDefault();
    if (sectionId !== 'overview') {
      setOpenSections((current) => ({ ...current, [sectionId]: true }));
    }
    window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.replaceState(window.history.state, '', `#${sectionId}`);
    }, 0);
  };

  const handleSectionToggle = (event: SyntheticEvent<HTMLDetailsElement>, sectionId: DetailSection) => {
    if (event.target !== event.currentTarget) return;
    const isOpen = event.currentTarget.open;
    setOpenSections((current) => current[sectionId] === isOpen ? current : { ...current, [sectionId]: isOpen });
  };

  return (
    <main className={styles.shell}>
      <div className={styles.bgOrbA} aria-hidden="true" /><div className={styles.bgOrbB} aria-hidden="true" />
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headingBlock}><p className={styles.kicker}>Operator activity record</p><h1 className={styles.title}>{detail?.summary.displayName || 'Operator Detail'}</h1><p className={styles.subtitle}>{email || 'Operator'} · onboarding, learning, submissions, and reviews</p></div>
          <div className={styles.actions}><Link className={styles.linkButton} href="/admin">Back to dashboard</Link><ThemeToggle size="sm" variant="surface" /></div>
        </header>
        {error ? <article className={styles.card}>{error}</article> : null}
        {!detail && !error ? <LoadingState title="Loading operator activity" message="Preparing onboarding, courses, attempts, and journey submissions…" preset="metrics" /> : null}

        {detail ? <>
          <nav className={styles.detailNav} aria-label="Operator detail sections"><a href="#overview" onClick={(event) => navigateToSection(event, 'overview')}>Overview</a><a href="#onboarding" onClick={(event) => navigateToSection(event, 'onboarding')}>Onboarding</a><a href="#courses" onClick={(event) => navigateToSection(event, 'courses')}>Courses</a><a href="#journey" onClick={(event) => navigateToSection(event, 'journey')}>30-day challenge</a></nav>
          <section id="overview" className={styles.detailHero}>
            <article className={styles.card}>
              <div className={styles.detailHeroTop}><div><p className={styles.cardLabel}>Operator summary</p><h2 className={styles.detailHeroTitle}>{detail.summary.displayName}</h2><p className={styles.detailHeroText}>{detail.operator.email}</p></div><div className={styles.badgeRow}><span className={badgeClass(detail.summary.progressState)}>{titleCase(detail.summary.progressState)}</span><span className={badgeClass(detail.summary.submissionState)}>Submission {titleCase(detail.summary.submissionState)}</span></div></div>
              <div className={styles.detailSummaryGrid}>{stats.map((item) => <div key={item.label} className={styles.detailSummaryCard}><p className={styles.cardLabel}>{item.label}</p><p className={styles.detailSummaryValue}>{item.value}</p></div>)}</div>
            </article>
            <article className={styles.card}><div className={styles.sectionHeader}><h2 className={styles.funnelTitle}>Operator record</h2><p className={styles.sectionMeta}>Account and profile</p></div><div className={styles.fieldGrid}>{[['Name', detail.record.name], ['Phone', detail.record.phone], ['Role', detail.record.role], ['Location', detail.record.location], ['Preferred language', detail.record.preferredLanguage], ['Last updated', formatDate(detail.record.updatedAt)]].map(([label, value]) => <div key={label} className={styles.fieldPair}><span className={styles.fieldLabel}>{label}</span><span className={styles.fieldValue}>{value || 'N/A'}</span></div>)}</div></article>
          </section>

          <details id="onboarding" className={`${styles.timelineSection} ${styles.collapsibleSection}`} open={openSections.onboarding} onToggle={(event) => handleSectionToggle(event, 'onboarding')}>
            <summary className={styles.collapsibleSummary}><div><p className={styles.kicker}>Foundation</p><h2 className={styles.funnelTitle}>Onboarding steps</h2></div><div className={styles.collapsibleMeta}><span className={styles.sectionMeta}>{detail.progress?.completedMilestones || 0}/{detail.summary.totalOnboardingSteps} complete</span><span className={styles.collapseChevron} aria-hidden="true">⌄</span></div></summary>
            <div className={styles.collapsibleBody}><div className={styles.accordionStack}>{detail.stepSections.map((section) => <details key={section.step} className={styles.activityDetails} open={section.status === 'current'}><summary><span className={styles.timelineStepNumber}>{section.step}</span><span className={styles.summaryText}><strong>{section.label}</strong><small>{section.summary}</small></span><span className={badgeClass(section.status)}>{section.statusLabel}</span></summary><div className={styles.detailsBody}><p className={styles.timelineNote}>{section.note}</p>{section.fields.length ? <div className={styles.fieldGrid}>{section.fields.map((field) => <div key={field.label} className={styles.fieldPair}><span className={styles.fieldLabel}>{field.label}</span><span className={styles.fieldValue}>{field.value}</span></div>)}</div> : <p className={styles.meta}>No additional stored inputs for this step.</p>}</div></details>)}</div></div>
          </details>

          <details id="courses" className={`${styles.timelineSection} ${styles.collapsibleSection}`} open={openSections.courses} onToggle={(event) => handleSectionToggle(event, 'courses')}>
            <summary className={styles.collapsibleSummary}><div><p className={styles.kicker}>Learning history</p><h2 className={styles.funnelTitle}>Courses and quiz attempts</h2></div><div className={styles.collapsibleMeta}><span className={styles.sectionMeta}>{detail.summary.completedLessons}/{detail.summary.totalLessons} lessons passed</span><span className={styles.collapseChevron} aria-hidden="true">⌄</span></div></summary>
            <div className={styles.collapsibleBody}><div className={styles.courseStack}>{detail.courses.map((course) => <article key={course.id} className={styles.courseCard}>
              <div className={styles.courseHeader}><div><p className={styles.cardLabel}>{course.divisionLabel}</p><h3>{course.title}</h3><p>{course.description}</p></div><div className={styles.courseProgress}><span className={badgeClass(course.status)}>{titleCase(course.status)}</span><strong>{course.percentComplete}%</strong><small>{course.completedLessons}/{course.totalLessons} lessons</small></div></div>
              <div className={styles.accordionStack}>{course.lessons.map((lesson) => <details key={lesson.id} className={styles.activityDetails}><summary><span className={styles.timelineStepNumber}>{lesson.order}</span><span className={styles.summaryText}><strong>{lesson.title}</strong><small>{lesson.attempts.length} attempt{lesson.attempts.length === 1 ? '' : 's'} · pass score {lesson.passScore}/{lesson.totalQuestions}</small></span><span className={badgeClass(lesson.status)}>{titleCase(lesson.status)}</span></summary><div className={styles.detailsBody}>
                <p className={styles.timelineNote}>{lesson.description}</p><div className={styles.inlineMeta}><span>Started: {formatDate(lesson.startedAt)}</span><span>Completed: {formatDate(lesson.completedAt)}</span><Link href={`/courses/${course.id}?lesson=${encodeURIComponent(lesson.id)}`}>Open course</Link></div>
                {lesson.attempts.length ? <div className={styles.attemptStack}>{lesson.attempts.map((attempt) => <details key={attempt.attemptNumber} className={styles.attemptDetails}><summary><strong>Attempt {attempt.attemptNumber}</strong><span>{attempt.score}/{lesson.totalQuestions}</span><span className={badgeClass(attempt.passed ? 'passed' : 'not_passed')}>{attempt.passed ? 'Passed' : 'Not passed'}</span><time>{formatDate(attempt.createdAt)}</time></summary><div className={styles.answerStack}>{attempt.answers.map((answer) => <div key={answer.questionId} className={styles.answerCard}><div><strong>{answer.question}</strong><span className={answer.correct ? styles.answerCorrect : styles.answerIncorrect}>{answer.correct ? 'Correct' : 'Incorrect'}</span></div><p><b>Operator answer:</b> {answer.answer || 'No answer'}</p>{!answer.correct ? <p><b>Correct answer:</b> {answer.correctAnswer}</p> : null}</div>)}</div></details>)}</div> : <p className={styles.emptyState}>No quiz attempts for this lesson.</p>}
              </div></details>)}</div>
            </article>)}</div></div>
          </details>

          <details id="journey" className={`${styles.timelineSection} ${styles.collapsibleSection}`} open={openSections.journey} onToggle={(event) => handleSectionToggle(event, 'journey')}>
            <summary className={styles.collapsibleSummary}><div><p className={styles.kicker}>Execution record</p><h2 className={styles.funnelTitle}>30-day challenge</h2></div><div className={styles.collapsibleMeta}><span className={styles.sectionMeta}>{detail.summary.completedJourneyDays}/{detail.summary.totalJourneyDays} complete</span><span className={styles.collapseChevron} aria-hidden="true">⌄</span></div></summary>
            <div className={styles.collapsibleBody}><div className={styles.sectionActions}><Link className={styles.linkButton} href="/admin/journey">Open review queue</Link></div><div className={styles.accordionStack}>{detail.journey.days.map((day) => <details key={day.templateId} className={styles.activityDetails} open={day.status === 'under_review' || day.status === 'submitted' || day.status === 'needs_correction'}><summary><span className={styles.timelineStepNumber}>{day.day}</span><span className={styles.summaryText}><strong>{day.title}</strong><small>{titleCase(day.category)} · {day.submittedAt ? `Submitted ${formatDate(day.submittedAt)}` : 'No submission'}</small></span><span className={badgeClass(day.status)}>{titleCase(day.status)}</span></summary><div className={styles.detailsBody}>
              <p className={styles.timelineNote}>{day.description}</p>{day.requiredOutput ? <div className={styles.requiredOutput}><span>Required output</span><p>{day.requiredOutput}</p></div> : null}
              {day.fields.length ? <><h4 className={styles.subsectionTitle}>Submitted inputs</h4><div className={styles.submissionGrid}>{day.fields.map((field, index) => <div key={`${field.label}-${index}`} className={styles.fieldPair}><span className={styles.fieldLabel}>{field.label}</span><pre className={styles.fieldPre}>{displayValue(field.value)}</pre></div>)}</div></> : <p className={styles.emptyState}>No inputs submitted for this day.</p>}
              {day.computedMetrics.length ? <><h4 className={styles.subsectionTitle}>Computed metrics</h4><div className={styles.fieldGrid}>{day.computedMetrics.map((metric) => <div key={metric.label} className={styles.fieldPair}><span className={styles.fieldLabel}>{metric.label}</span><span className={styles.fieldValue}>{displayValue(metric.value)}</span></div>)}</div></> : null}
              {day.reviewNote || day.reviewedAt ? <div className={styles.reviewBox}><div><span>Reviewed</span><strong>{formatDate(day.reviewedAt)}{day.reviewedBy ? ` by ${day.reviewedBy}` : ''}</strong></div>{day.reviewNote ? <p>{day.reviewNote}</p> : null}</div> : null}
              <div className={styles.inlineMeta}>{day.href ? <Link href={day.href}>{day.actionLabel || 'Open related page'}</Link> : null}{day.submissionId ? <Link href="/admin/journey">Review this submission</Link> : null}</div>
            </div></details>)}</div></div>
          </details>
        </> : null}
      </div>
    </main>
  );
}

export default function AdminOperatorDetailPage() { return <AdminGate>{() => <DetailContent />}</AdminGate>; }
