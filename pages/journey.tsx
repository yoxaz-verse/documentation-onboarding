import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import AuthGate from '../components/AuthGate';
import OnboardingLayout from '../components/OnboardingLayout';
import { JOURNEY_PAGE_COPY, JOURNEY_TOTAL_DAYS, type JourneyDayTemplate, type JourneyFormField, type JourneyRepeatGroup } from '../config/operatorJourney';
import { isUnauthorizedError } from '../lib/http';
import { areCoursesUnlocked } from '../lib/onboarding';
import type { CourseProgressSummary, JourneyResponse, JourneySummary, ProgressRecord } from '../lib/types';
import styles from './onboarding.module.css';

type JourneyPageState =
  | { status: 'loading' }
  | { status: 'ready'; progress: ProgressRecord; courseProgress: CourseProgressSummary; journey: JourneySummary }
  | { status: 'error'; message: string };

type Answers = Record<string, unknown>;
type FormError = {
  key: string;
  message: string;
};

function clampTimelineDay(day: number | null) {
  if (!day) return 1;
  return Math.max(1, Math.min(JOURNEY_TOTAL_DAYS, day));
}

function categoryLabel(category: string) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function emptyEntry(group: JourneyRepeatGroup) {
  return group.fields.reduce<Record<string, unknown>>((acc, field) => {
    acc[field.id] = field.type === 'checkbox' ? false : '';
    return acc;
  }, {});
}

function normalizeAnswers(template: JourneyDayTemplate, submissionAnswers?: Record<string, unknown> | null): Answers {
  const answers: Answers = { ...(submissionAnswers || {}) };
  template.formFields.forEach((field) => {
    if (!(field.id in answers)) answers[field.id] = field.type === 'checkbox' ? false : '';
  });
  template.repeatGroups.forEach((group) => {
    if (!Array.isArray(answers[group.id])) {
      answers[group.id] = Array.from({ length: group.minEntries }, () => emptyEntry(group));
    }
  });
  return answers;
}

function isEmptyValue(value: unknown) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function fieldKey(fieldId: string) {
  return `field:${fieldId}`;
}

function groupFieldKey(groupId: string, index: number, fieldId: string) {
  return `group:${groupId}:${index}:${fieldId}`;
}

function validateFieldValue(field: JourneyFormField, value: unknown, key: string, prefix = ''): FormError[] {
  const errors: FormError[] = [];

  if (field.required && (field.type === 'checkbox' ? value !== true : isEmptyValue(value))) {
    errors.push({ key, message: `${prefix}${field.label} is required.` });
    return errors;
  }

  if (field.type === 'number' && !isEmptyValue(value)) {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) errors.push({ key, message: `${prefix}${field.label} must be a number.` });
    if (field.min !== undefined && numeric < field.min) errors.push({ key, message: `${prefix}${field.label} must be at least ${field.min}.` });
    if (field.max !== undefined && numeric > field.max) errors.push({ key, message: `${prefix}${field.label} must be at most ${field.max}.` });
  }

  return errors;
}

function validateAnswers(template: JourneyDayTemplate, answers: Answers): FormError[] {
  const errors: FormError[] = [];

  template.formFields.forEach((field) => {
    errors.push(...validateFieldValue(field, answers[field.id], fieldKey(field.id)));
  });

  template.repeatGroups.forEach((group) => {
    const entries = Array.isArray(answers[group.id]) ? answers[group.id] as Record<string, unknown>[] : [];
    if (entries.length < group.minEntries) {
      errors.push({ key: `group:${group.id}`, message: `${group.label} needs at least ${group.minEntries} ${group.minEntries === 1 ? 'entry' : 'entries'}.` });
    }
    entries.forEach((entry, index) => {
      group.fields.forEach((field) => {
        errors.push(...validateFieldValue(field, entry?.[field.id], groupFieldKey(group.id, index, field.id), `${group.label} #${index + 1}: `));
      });
    });
  });

  template.keywordRules?.forEach((rule) => {
    const text = String(answers[rule.fieldId] || '').toLowerCase();
    const missing = rule.keywords.filter((keyword) => !text.includes(keyword.toLowerCase()));
    if (missing.length) {
      errors.push({ key: fieldKey(rule.fieldId), message: `The answer must mention: ${missing.join(', ')}.` });
    }
  });

  return errors;
}

function getNextActionableDay(journey: JourneySummary) {
  const firstIncomplete = journey.dayStatuses.find((item) => item.status !== 'completed');
  return firstIncomplete?.day || journey.dayTemplates[journey.dayTemplates.length - 1]?.day || 1;
}

function isDayAccessible(journey: JourneySummary, day: number) {
  const status = journey.dayStatuses.find((item) => item.day === day);
  const nextActionableDay = getNextActionableDay(journey);
  return day <= nextActionableDay || status?.status === 'completed' || status?.status === 'needs_correction' || status?.status === 'under_review';
}

function lockedReason(journey: JourneySummary, day: number) {
  const previousIncomplete = journey.dayStatuses.find((item) => item.day < day && item.status !== 'completed');
  if (previousIncomplete) return `Complete Day ${previousIncomplete.day} before opening Day ${day}.`;
  return `Complete the current day before opening Day ${day}.`;
}

function FieldInput({
  field,
  value,
  onChange,
  invalid,
  inputKey,
}: {
  field: JourneyFormField;
  value: unknown;
  onChange: (value: unknown) => void;
  invalid?: boolean;
  inputKey: string;
}) {
  if (field.type === 'textarea') {
    return <textarea data-field-key={inputKey} className={invalid ? styles.journeyInputInvalid : ''} value={String(value || '')} onChange={(event) => onChange(event.target.value)} placeholder={field.placeholder} rows={4} />;
  }

  if (field.type === 'select') {
    return (
      <select data-field-key={inputKey} className={invalid ? styles.journeyInputInvalid : ''} value={String(value || '')} onChange={(event) => onChange(event.target.value)}>
        <option value="">Select</option>
        {(field.options || []).map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    );
  }

  if (field.type === 'checkbox') {
    return (
      <label className={`${styles.journeyBoolean} ${invalid ? styles.journeyInputInvalid : ''}`}>
        <input data-field-key={inputKey} type="checkbox" checked={value === true} onChange={(event) => onChange(event.target.checked)} />
        <span>Confirmed</span>
      </label>
    );
  }

  return (
    <input
      data-field-key={inputKey}
      className={invalid ? styles.journeyInputInvalid : ''}
      type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
      min={field.min}
      max={field.max}
      value={String(value || '')}
      onChange={(event) => onChange(field.type === 'number' ? event.target.value : event.target.value)}
      placeholder={field.placeholder}
    />
  );
}

function SkeletonBlock({ className = '' }: { className?: string }) {
  return <span className={`${styles.skeletonBlock} ${className}`} aria-hidden="true" />;
}

function JourneyLoadingState() {
  return (
    <div className={styles.loadingWorkspace} role="status" aria-live="polite" aria-busy="true">
      <section className={`${styles.callout} ${styles.journeyHero} ${styles.journeyLoadingHero}`}>
        <div className={styles.homeHeroHeader}>
          <div>
            <p className={styles.homeHeroEyebrow}>Operator execution path</p>
            <h2 className={styles.homeHeroTitle}>Preparing your 30-day path</h2>
          </div>
          <span className={styles.loadingSpinner} aria-hidden="true" />
        </div>
        <p className={styles.calloutText}>Fetching your milestones, daily form, and progress snapshot.</p>
        <div className={styles.progressTrack} aria-hidden="true">
          <span className={`${styles.progressFill} ${styles.loadingProgressFill}`} />
        </div>
      </section>

      <section className={styles.journeyStatsGrid} aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <article key={index} className={styles.kpiCard}>
            <SkeletonBlock className={styles.skeletonLabel} />
            <SkeletonBlock className={styles.skeletonValue} />
          </article>
        ))}
      </section>

      <section className={styles.journeyMetricsGrid} aria-hidden="true">
        {Array.from({ length: 12 }, (_, index) => (
          <article key={index} className={styles.journeyMetricCard}>
            <SkeletonBlock className={styles.skeletonMetricLabel} />
            <SkeletonBlock className={styles.skeletonMetricValue} />
          </article>
        ))}
      </section>

      <section className={styles.journeyWorkspace} aria-hidden="true">
        <div className={styles.journeyDayContent}>
          <div className={styles.journeyMilestoneHeader}>
            <SkeletonBlock className={styles.skeletonBadge} />
            <SkeletonBlock className={styles.skeletonBadgeSmall} />
          </div>
          <SkeletonBlock className={styles.skeletonEyebrow} />
          <SkeletonBlock className={styles.skeletonTitle} />
          <SkeletonBlock className={styles.skeletonTextWide} />
          <SkeletonBlock className={styles.skeletonTextMedium} />
          <div className={styles.journeyInfoGrid}>
            <article><SkeletonBlock className={styles.skeletonTextWide} /><SkeletonBlock className={styles.skeletonTextMedium} /></article>
            <article><SkeletonBlock className={styles.skeletonTextWide} /><SkeletonBlock className={styles.skeletonTextMedium} /></article>
          </div>
        </div>

        <div className={styles.journeyFormPanel}>
          <div className={styles.sectionHeader}>
            <div>
              <SkeletonBlock className={styles.skeletonTitleSmall} />
              <SkeletonBlock className={styles.skeletonTextMedium} />
            </div>
            <SkeletonBlock className={styles.skeletonBadgeSmall} />
          </div>
          <div className={styles.journeyFormGrid}>
            {Array.from({ length: 4 }, (_, index) => (
              <label key={index} className={styles.journeyField}>
                <SkeletonBlock className={styles.skeletonMetricLabel} />
                <SkeletonBlock className={styles.skeletonInput} />
              </label>
            ))}
          </div>
          <SkeletonBlock className={styles.skeletonTextarea} />
        </div>
      </section>

      <section className={styles.journeyTimelinePanel} aria-hidden="true">
        <div className={styles.sectionHeader}>
          <div>
            <SkeletonBlock className={styles.skeletonTitleSmall} />
            <SkeletonBlock className={styles.skeletonTextMedium} />
          </div>
        </div>
        <div className={styles.journeyTimelineGrid}>
          {Array.from({ length: JOURNEY_TOTAL_DAYS }, (_, index) => (
            <div key={index} className={`${styles.journeyTimelineItem} ${styles.journeyTimelineItemLoading}`}>
              <SkeletonBlock className={styles.skeletonTimelineText} />
              <SkeletonBlock className={styles.skeletonTimelineStatus} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function JourneyContent() {
  const [state, setState] = useState<JourneyPageState>({ status: 'loading' });
  const [savingId, setSavingId] = useState('');
  const [message, setMessage] = useState('');
  const [formErrors, setFormErrors] = useState<FormError[]>([]);
  const [localNotice, setLocalNotice] = useState('');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Answers>({});

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

      setState({ status: 'ready', progress: payload.progress, courseProgress: payload.courseProgress, journey: payload.journey });
      setSelectedDay((current) => (current && isDayAccessible(payload.journey!, current) ? current : getNextActionableDay(payload.journey!)));
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

  const startJourney = async () => {
    setSavingId('journey-start');
    setMessage('');
    try {
      const response = await fetch('/api/journey/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || 'Failed to start Day 1.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to start Day 1.');
    } finally {
      setSavingId('');
    }
  };

  const selectedTemplate = useMemo(() => {
    if (state.status !== 'ready') return null;
    const activeSelectedDay = selectedDay && isDayAccessible(state.journey, selectedDay) ? selectedDay : getNextActionableDay(state.journey);
    return state.journey.dayTemplates.find((template) => template.day === activeSelectedDay) || state.journey.dayTemplates[0] || null;
  }, [state, selectedDay]);

  const selectedStatus = useMemo(() => {
    if (state.status !== 'ready' || !selectedTemplate) return null;
    return state.journey.dayStatuses.find((item) => item.day === selectedTemplate.day) || null;
  }, [state, selectedTemplate]);

  useEffect(() => {
    if (selectedTemplate) {
      setAnswers(normalizeAnswers(selectedTemplate, selectedStatus?.submission?.answers || null));
      setFormErrors([]);
      setLocalNotice('');
    }
  }, [selectedTemplate?.id, selectedStatus?.submission?.id]);

  const setField = (fieldId: string, value: unknown) => {
    setAnswers((current) => ({ ...current, [fieldId]: value }));
    setFormErrors((current) => current.filter((error) => error.key !== fieldKey(fieldId)));
  };

  const setGroupField = (group: JourneyRepeatGroup, index: number, fieldId: string, value: unknown) => {
    setAnswers((current) => {
      const entries = Array.isArray(current[group.id]) ? [...current[group.id] as Record<string, unknown>[]] : [];
      entries[index] = { ...(entries[index] || emptyEntry(group)), [fieldId]: value };
      return { ...current, [group.id]: entries };
    });
    setFormErrors((current) => current.filter((error) => error.key !== groupFieldKey(group.id, index, fieldId) && error.key !== `group:${group.id}`));
  };

  const addGroupEntry = (group: JourneyRepeatGroup) => {
    setAnswers((current) => {
      const entries = Array.isArray(current[group.id]) ? [...current[group.id] as Record<string, unknown>[]] : [];
      return { ...current, [group.id]: [...entries, emptyEntry(group)] };
    });
    setFormErrors((current) => current.filter((error) => error.key !== `group:${group.id}`));
  };

  const submitDay = async () => {
    if (!selectedTemplate) return;
    const localErrors = validateAnswers(selectedTemplate, answers);
    if (localErrors.length) {
      setFormErrors(localErrors);
      setLocalNotice('');
      const firstInvalid = document.querySelector(`[data-field-key="${localErrors[0].key}"]`) as HTMLElement | null;
      firstInvalid?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      firstInvalid?.focus?.();
      return;
    }

    setSavingId(`submit-${selectedTemplate.day}`);
    setMessage('');
    setFormErrors([]);
    setLocalNotice('');
    try {
      const response = await fetch(`/api/journey/day/${selectedTemplate.day}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ answers }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const apiErrors = Array.isArray(payload?.errors) ? payload.errors.map((error: string) => ({ key: 'api', message: error })) : [];
        setFormErrors(apiErrors);
        setLocalNotice(payload?.error || 'Please complete the required day fields.');
        return;
      }
      setMessage(payload?.completionMessage || (payload?.status === 'under_review' ? 'Submitted for admin review.' : 'Day completed.'));
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to submit day.');
    } finally {
      setSavingId('');
    }
  };

  const reopenDay = async () => {
    if (!selectedTemplate) return;
    setSavingId(`reopen-${selectedTemplate.day}`);
    setMessage('');
    setFormErrors([]);
    setLocalNotice('');
    try {
      const response = await fetch(`/api/journey/day/${selectedTemplate.day}/reopen`, { method: 'POST', credentials: 'include' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || 'Failed to reopen day.');
      setMessage('Day reopened. Update the form and submit again.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to reopen day.');
    } finally {
      setSavingId('');
    }
  };

  if (state.status === 'loading') {
    return (
      <OnboardingLayout title="Operator Journey" subtitle="Loading your Day 1 path and milestone progress..." loading>
        <JourneyLoadingState />
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
  const checksComplete = journey.completedCheckCount === journey.totalCheckCount;
  const currentDay = journey.currentDay;
  const visibleDay = clampTimelineDay(currentDay);
  const completionPercent = Math.round((journey.completedMilestoneCount / journey.totalMilestoneCount) * 100);
  const dayPercent = Math.round((Math.min(visibleDay, JOURNEY_TOTAL_DAYS) / JOURNEY_TOTAL_DAYS) * 100);
  const dueCount = journey.dayStatuses.filter((item) => ['catch_up', 'needs_correction', 'pending'].includes(item.status) && item.day <= visibleDay).length;
  const formErrorKeys = new Set(formErrors.map((error) => error.key));

  const selectTimelineDay = (day: number) => {
    if (!isDayAccessible(journey, day)) {
      setLocalNotice(lockedReason(journey, day));
      return;
    }
    setSelectedDay(day);
    setLocalNotice('');
  };

  const aside = (
    <section className={styles.sidebarPanel}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sideTitleLike}>Journey snapshot</h2>
          <p className={styles.sectionHint}>Your operator day count, course progress, and workflow status in one place.</p>
        </div>
      </div>
      <div className={styles.journeyAsideStack}>
        <div className={styles.journeyAsideItem}><span>Operator day</span><strong>{currentDay ? `Day ${currentDay}` : 'Not started'}</strong></div>
        <div className={styles.journeyAsideItem}><span>Completed days</span><strong>{journey.completedMilestoneCount}/{journey.totalMilestoneCount}</strong></div>
        <div className={styles.journeyAsideItem}><span>Review/catch-up</span><strong>{dueCount}</strong></div>
      </div>
    </section>
  );

  return (
    <OnboardingLayout title={JOURNEY_PAGE_COPY.title} subtitle={JOURNEY_PAGE_COPY.subtitle} progress={progress} courseProgress={courseProgress} aside={aside}>
      {message ? <p className={`${styles.message} ${message.includes('Failed') || message.includes('Please') ? styles.messageError : styles.messageSuccess}`}>{message}</p> : null}

      <section className={`${styles.callout} ${styles.journeyHero}`}>
        <div className={styles.homeHeroHeader}>
          <div>
            <p className={styles.homeHeroEyebrow}>Operator execution path</p>
            <h2 className={styles.homeHeroTitle}>{currentDay ? `Day ${currentDay}: build market momentum` : 'Start the 30-day execution path'}</h2>
          </div>
          <span className={styles.homeStatusPill}>{currentDay ? `${completionPercent}% complete` : `${journey.completedCheckCount}/${journey.totalCheckCount} checks`}</span>
        </div>
        <p className={styles.calloutText}>{JOURNEY_PAGE_COPY.description}</p>
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
                    <input type="checkbox" checked={checked} disabled={savingId === check.id} onChange={(event) => toggleCheck(check.id, event.target.checked)} />
                    <span><strong>{check.label}</strong><small>{check.description}</small></span>
                  </label>
                );
              })}
            </div>
          </div>
          <aside className={styles.journeyStartPanel}>
            <p className={styles.kpiLabel}>Start condition</p>
            <p className={styles.kpiValue}>{checksComplete ? 'Ready for Day 1' : 'Finish checklist'}</p>
            <p className={styles.sectionHint}>Your Day 1 count begins once. After it starts, daily forms can be submitted, reviewed, corrected, and completed.</p>
            <button type="button" className={styles.primaryButton} disabled={!checksComplete || savingId === 'journey-start'} onClick={startJourney}>
              {savingId === 'journey-start' ? 'Starting...' : 'Start Day 1'}
            </button>
          </aside>
        </section>
      ) : (
        <>
          <section className={styles.journeyStatsGrid}>
            <article className={styles.kpiCard}><p className={styles.kpiLabel}>Current operator day</p><p className={styles.kpiValue}>Day {currentDay}</p></article>
            <article className={styles.kpiCard}><p className={styles.kpiLabel}>30-day path</p><p className={styles.kpiValue}>{dayPercent}% elapsed</p></article>
            <article className={styles.kpiCard}><p className={styles.kpiLabel}>Milestones done</p><p className={styles.kpiValue}>{journey.completedMilestoneCount}/{journey.totalMilestoneCount}</p></article>
            <article className={styles.kpiCard}><p className={styles.kpiLabel}>Track status</p><p className={styles.kpiValue}>{dueCount ? `${dueCount} to handle` : 'On track'}</p></article>
          </section>

          <section className={styles.journeyMetricsGrid}>
            {[
              ['Suppliers', journey.metrics.suppliersAdded],
              ['Buyers', journey.metrics.buyersAdded],
              ['Products', journey.metrics.productsMapped],
              ['Availability', journey.metrics.availabilitiesLogged],
              ['Requirements', journey.metrics.buyerRequirementsLogged],
              ['Outreach', journey.metrics.outreachDone],
              ['Responses', journey.metrics.responsesReceived],
              ['Follow-ups', journey.metrics.followUpsPending],
              ['Matches', journey.metrics.matchesAttempted],
              ['Quote-ready', journey.metrics.quotationReadyInquiries],
              ['Avg score', journey.metrics.opportunityScoreAverage],
              ['Readiness', journey.metrics.executionReadinessScore],
            ].map(([label, value]) => (
              <article key={label} className={styles.journeyMetricCard}><span>{label}</span><strong>{value}</strong></article>
            ))}
          </section>

          {selectedTemplate && selectedStatus ? (
            <section className={styles.journeyWorkspace}>
              <div className={styles.journeyDayContent}>
                <div className={styles.journeyMilestoneHeader}>
                  <span className={styles.journeyDayBadge}>Day {selectedTemplate.day}</span>
                  <span className={styles.courseBadge}>{selectedStatus.label}</span>
                </div>
                <p className={styles.homeHeroEyebrow}>{selectedTemplate.phase} · {selectedTemplate.dayType}</p>
                <h2 className={styles.homeHeroTitle}>{selectedTemplate.title}</h2>
                <p className={styles.calloutText}>{selectedTemplate.description}</p>
                <div className={styles.journeyInfoGrid}>
                  <article>
                    <h3>Purpose</h3>
                    <p>{selectedTemplate.purpose}</p>
                  </article>
                  <article>
                    <h3>Required output</h3>
                    <p>{selectedTemplate.requiredOutput}</p>
                  </article>
                </div>
                <div className={styles.journeyListGrid}>
                  <article>
                    <h3>What to learn</h3>
                    <ul>{selectedTemplate.learn.map((item) => <li key={item}>{item}</li>)}</ul>
                  </article>
                  <article>
                    <h3>Tasks</h3>
                    <ol>{selectedTemplate.tasks.map((item) => <li key={item}>{item}</li>)}</ol>
                  </article>
                </div>
                {selectedTemplate.href ? <Link href={selectedTemplate.href} className={styles.inlineLink}>{selectedTemplate.actionLabel || 'Open related page'}</Link> : null}
              </div>

              <div className={styles.journeyFormPanel}>
                <div className={styles.sectionHeader}>
                  <div>
                    <h2 className={styles.courseCardTitle}>Day submission</h2>
                    <p className={styles.sectionHint}>{selectedTemplate.reviewRequired ? 'This day requires admin review after submission.' : 'This day completes automatically when validation passes.'}</p>
                  </div>
                  <span className={styles.pointsBadge}>{categoryLabel(selectedTemplate.category)}</span>
                </div>

                <div className={styles.journeyFormGrid}>
                  {selectedTemplate.formFields.map((field) => (
                    <label key={field.id} className={`${styles.journeyField} ${field.type === 'textarea' ? styles.journeyFieldWide : ''} ${formErrorKeys.has(fieldKey(field.id)) ? styles.journeyFieldInvalid : ''}`}>
                      <span>{field.label}{field.required ? ' *' : ''}</span>
                      <FieldInput
                        field={field}
                        value={answers[field.id]}
                        onChange={(value) => setField(field.id, value)}
                        invalid={formErrorKeys.has(fieldKey(field.id))}
                        inputKey={fieldKey(field.id)}
                      />
                    </label>
                  ))}
                </div>

                {selectedTemplate.repeatGroups.map((group) => {
                  const entries = Array.isArray(answers[group.id]) ? answers[group.id] as Record<string, unknown>[] : [];
                  return (
                    <section key={group.id} className={`${styles.journeyRepeatGroup} ${formErrorKeys.has(`group:${group.id}`) ? styles.journeyFieldInvalid : ''}`}>
                      <div className={styles.sectionHeader}>
                        <div>
                          <h3 className={styles.journeyMilestoneTitle}>{group.label}</h3>
                          <p className={styles.sectionHint}>Minimum {group.minEntries} entries required.</p>
                        </div>
                        <button type="button" className={styles.secondaryButton} onClick={() => addGroupEntry(group)}>Add entry</button>
                      </div>
                      {entries.map((entry, index) => (
                        <article key={`${group.id}-${index}`} className={styles.journeyRepeatEntry}>
                          <p className={styles.kpiLabel}>Entry {index + 1}</p>
                          <div className={styles.journeyFormGrid}>
                            {group.fields.map((field) => (
                              <label key={field.id} className={`${styles.journeyField} ${field.type === 'textarea' ? styles.journeyFieldWide : ''} ${formErrorKeys.has(groupFieldKey(group.id, index, field.id)) ? styles.journeyFieldInvalid : ''}`}>
                                <span>{field.label}{field.required ? ' *' : ''}</span>
                                <FieldInput
                                  field={field}
                                  value={entry[field.id]}
                                  onChange={(value) => setGroupField(group, index, field.id, value)}
                                  invalid={formErrorKeys.has(groupFieldKey(group.id, index, field.id))}
                                  inputKey={groupFieldKey(group.id, index, field.id)}
                                />
                              </label>
                            ))}
                          </div>
                        </article>
                      ))}
                    </section>
                  );
                })}

                {selectedStatus.submission?.review_note ? <p className={`${styles.message} ${styles.messageError}`}>{selectedStatus.submission.review_note}</p> : null}

                {formErrors.length ? (
                  <div className={styles.journeyInlineWarning} role="alert">
                    <strong>{localNotice || `Complete ${formErrors.length} required ${formErrors.length === 1 ? 'field' : 'fields'} before submitting.`}</strong>
                    <ul>
                      {formErrors.slice(0, 5).map((error, index) => <li key={`${error.key}-${index}`}>{error.message}</li>)}
                    </ul>
                    {formErrors.length > 5 ? <p>And {formErrors.length - 5} more required {formErrors.length - 5 === 1 ? 'item' : 'items'}.</p> : null}
                  </div>
                ) : null}

                <p className={styles.journeySubmitHint}>
                  {selectedStatus.status === 'under_review'
                    ? 'This day is submitted and waiting for admin review.'
                    : selectedStatus.status === 'completed'
                      ? 'This day is completed. Reopen only if you need to correct it.'
                      : 'Fill all required fields to confirm this day.'}
                </p>

                <div className={styles.cardActions}>
                  <button type="button" className={styles.primaryButton} disabled={savingId === `submit-${selectedTemplate.day}`} onClick={submitDay}>
                    {savingId === `submit-${selectedTemplate.day}` ? 'Submitting...' : selectedTemplate.buttonText}
                  </button>
                  {selectedStatus.submission ? (
                    <button type="button" className={styles.secondaryButton} disabled={savingId === `reopen-${selectedTemplate.day}`} onClick={reopenDay}>
                      {savingId === `reopen-${selectedTemplate.day}` ? 'Reopening...' : 'Reopen'}
                    </button>
                  ) : null}
                </div>
              </div>
            </section>
          ) : null}

          <section className={styles.journeyTimelinePanel} aria-label="30-day journey timeline">
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.courseCardTitle}>30-day workflow calendar</h2>
                <p className={styles.sectionHint}>Complete each day in order. Locked days will open after earlier required days are completed.</p>
              </div>
            </div>
            {localNotice && !formErrors.length ? <p className={styles.journeyCalendarNotice}>{localNotice}</p> : null}
            <div className={styles.journeyTimelineGrid}>
              {journey.dayStatuses.map((item) => {
                const isToday = item.day === visibleDay;
                const isSelected = item.day === selectedTemplate?.day;
                const done = item.status === 'completed';
                const needsAttention = ['catch_up', 'needs_correction', 'under_review'].includes(item.status);
                const locked = !isDayAccessible(journey, item.day);
                const className = `${styles.journeyTimelineItem} ${done ? styles.journeyTimelineItemDone : ''} ${isToday && !locked ? styles.journeyTimelineItemToday : ''} ${needsAttention && !locked ? styles.journeyTimelineItemDue : ''} ${isSelected ? styles.journeyTimelineItemSelected : ''} ${locked ? styles.journeyTimelineItemLocked : ''}`;
                return (
                  <button
                    key={item.templateId}
                    type="button"
                    className={className}
                    aria-disabled={locked}
                    title={locked ? lockedReason(journey, item.day) : item.label}
                    onClick={() => selectTimelineDay(item.day)}
                  >
                    <span>Day {item.day}</span>
                    <strong>{locked ? 'Locked' : item.label}</strong>
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
