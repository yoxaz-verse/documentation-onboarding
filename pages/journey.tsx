import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import AuthGate from '../components/AuthGate';
import OnboardingLayout from '../components/OnboardingLayout';
import SupportContactList from '../components/SupportContactList';
import { LoadingButtonContent, SkeletonBlock, Spinner } from '../components/LoadingState';
import { JOURNEY_PAGE_COPY, JOURNEY_TOTAL_DAYS, type JourneyDayTemplate, type JourneyFormField, type JourneyRepeatGroup } from '../config/operatorJourney';
import { isUnauthorizedError } from '../lib/http';
import { shuffledCopy } from '../lib/shuffle';
import type { CourseProgressSummary, JourneyResponse, JourneySummary, ProgressRecord } from '../lib/types';
import styles from './onboarding.module.css';

type JourneyPageState =
  | { status: 'loading' }
  | { status: 'locked'; progress: ProgressRecord; courseProgress: CourseProgressSummary }
  | { status: 'ready'; progress: ProgressRecord; courseProgress: CourseProgressSummary; journey: JourneySummary }
  | { status: 'error'; message: string };

type Answers = Record<string, unknown>;
type FormError = {
  key: string;
  message: string;
};
type ScenarioGrade = {
  score: number;
  total: number;
  passScore: number;
  passed: boolean;
  results: Array<{ id: string; correct: boolean; correctAnswer: string; explanation: string }>;
};

function clampTimelineDay(day: number | null) {
  if (!day) return 1;
  return Math.max(1, Math.min(JOURNEY_TOTAL_DAYS, day));
}

function categoryLabel(category: string) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
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
  if (template.scenarioQuestions?.length && (!answers.scenarioAnswers || typeof answers.scenarioAnswers !== 'object')) {
    answers.scenarioAnswers = {};
  }
  return answers;
}

function gradeScenarioAnswers(template: JourneyDayTemplate, answers: Answers): ScenarioGrade | null {
  if (!template.scenarioQuestions?.length) return null;
  const scenarioAnswers = answers.scenarioAnswers && typeof answers.scenarioAnswers === 'object'
    ? answers.scenarioAnswers as Record<string, unknown>
    : {};
  const results = template.scenarioQuestions.map((scenario) => ({
    id: scenario.id,
    correct: String(scenarioAnswers[scenario.id] || '') === scenario.correctAnswer,
    correctAnswer: scenario.correctAnswer,
    explanation: scenario.explanation,
  }));
  const score = results.filter((result) => result.correct).length;
  const passScore = template.scenarioPassScore || results.length;
  return { score, total: results.length, passScore, passed: score >= passScore, results };
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

  if (template.scenarioQuestions?.length) {
    const scenarioAnswers = answers.scenarioAnswers && typeof answers.scenarioAnswers === 'object'
      ? answers.scenarioAnswers as Record<string, unknown>
      : {};
    template.scenarioQuestions.forEach((scenario) => {
      if (isEmptyValue(scenarioAnswers[scenario.id])) {
        errors.push({ key: `scenario:${scenario.id}`, message: `${scenario.title} needs an answer.` });
      }
    });
  }

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
  if (previousIncomplete) return `Complete Level ${previousIncomplete.day} before opening Level ${day}.`;
  return `Complete the current level before opening Level ${day}.`;
}

function FieldInput({
  field,
  value,
  onChange,
  invalid,
  inputKey,
  disabled = false,
}: {
  field: JourneyFormField;
  value: unknown;
  onChange: (value: unknown) => void;
  invalid?: boolean;
  inputKey: string;
  disabled?: boolean;
}) {
  if (field.type === 'textarea') {
    return <textarea data-field-key={inputKey} className={invalid ? styles.journeyInputInvalid : ''} value={String(value || '')} onChange={(event) => onChange(event.target.value)} placeholder={field.placeholder} rows={4} disabled={disabled} />;
  }

  if (field.type === 'select') {
    return (
      <select data-field-key={inputKey} className={invalid ? styles.journeyInputInvalid : ''} value={String(value || '')} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
        <option value="">Select</option>
        {(field.options || []).map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    );
  }

  if (field.type === 'checkbox') {
    return (
      <label className={`${styles.journeyBoolean} ${invalid ? styles.journeyInputInvalid : ''}`} aria-disabled={disabled}>
        <input data-field-key={inputKey} type="checkbox" checked={value === true} onChange={(event) => onChange(event.target.checked)} disabled={disabled} />
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
      disabled={disabled}
    />
  );
}

function JourneyLoadingState() {
  return (
    <div className={styles.loadingWorkspace} role="status" aria-live="polite" aria-busy="true">
      <section className={`${styles.callout} ${styles.journeyHero} ${styles.journeyLoadingHero}`}>
        <div className={styles.homeHeroHeader}>
          <div>
            <p className={styles.homeHeroEyebrow}>Operator execution path</p>
            <h2 className={styles.homeHeroTitle}>Preparing your 30-level path</h2>
          </div>
          <Spinner size="large" />
        </div>
        <p className={styles.calloutText}>Fetching your milestones, level form, and progress snapshot.</p>
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
  const [savingCheckIds, setSavingCheckIds] = useState<Set<string>>(() => new Set());
  const [message, setMessage] = useState('');
  const [formErrors, setFormErrors] = useState<FormError[]>([]);
  const [localNotice, setLocalNotice] = useState('');
  const [scenarioGrade, setScenarioGrade] = useState<ScenarioGrade | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [scenarioOptionOrder, setScenarioOptionOrder] = useState<Record<string, string[]>>({});
  const journeyWorkspaceRef = useRef<HTMLElement | null>(null);
  const scrollToWorkspaceAfterLoadRef = useRef(false);

  const load = async ({ selectNextActionable = false }: { selectNextActionable?: boolean } = {}) => {
    try {
      const response = await fetch('/api/journey', { credentials: 'include', cache: 'no-store' });
      const payload = (await response.json().catch(() => ({}))) as Partial<JourneyResponse> & { error?: string };

      if (!response.ok || !payload.progress || !payload.courseProgress || !payload.access) {
        if (response.status === 401) {
          window.location.assign('/');
          return;
        }
        throw new Error(payload.error || 'Failed to load operator journey.');
      }

      if (payload.access === 'locked') {
        setState({ status: 'locked', progress: payload.progress, courseProgress: payload.courseProgress });
        setMessage('');
        return;
      }

      if (!payload.journey) throw new Error('Failed to load operator journey.');

      setState({ status: 'ready', progress: payload.progress, courseProgress: payload.courseProgress, journey: payload.journey });
      setSelectedDay((current) => {
        if (selectNextActionable) return getNextActionableDay(payload.journey!);
        return current && payload.journey!.dayTemplates.some((template) => template.day === current)
          ? current
          : getNextActionableDay(payload.journey!);
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
    if (savingCheckIds.has(checkId)) return;

    setSavingCheckIds((current) => new Set(current).add(checkId));
    setMessage('');
    setState((current) => {
      if (current.status !== 'ready') return current;

      const completedChecks = new Set(current.journey.completedChecks);
      if (completed) completedChecks.add(checkId);
      else completedChecks.delete(checkId);

      return {
        ...current,
        journey: {
          ...current.journey,
          completedChecks: Array.from(completedChecks),
          completedCheckCount: completedChecks.size,
        },
      };
    });

    try {
      const response = await fetch('/api/journey/checks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ checkId, completed }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || 'Failed to update checklist.');
    } catch (error) {
      setState((current) => {
        if (current.status !== 'ready') return current;

        const completedChecks = new Set(current.journey.completedChecks);
        if (completed) completedChecks.delete(checkId);
        else completedChecks.add(checkId);

        return {
          ...current,
          journey: {
            ...current.journey,
            completedChecks: Array.from(completedChecks),
            completedCheckCount: completedChecks.size,
          },
        };
      });
      setMessage(error instanceof Error ? error.message : 'Failed to update checklist.');
    } finally {
      setSavingCheckIds((current) => {
        const next = new Set(current);
        next.delete(checkId);
        return next;
      });
    }
  };

  const startJourney = async () => {
    setSavingId('journey-start');
    setMessage('');
    try {
      const response = await fetch('/api/journey/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || 'Failed to start Level 1.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to start Level 1.');
    } finally {
      setSavingId('');
    }
  };

  const selectedTemplate = useMemo(() => {
    if (state.status !== 'ready') return null;
    const activeSelectedDay = selectedDay || getNextActionableDay(state.journey);
    return state.journey.dayTemplates.find((template) => template.day === activeSelectedDay) || state.journey.dayTemplates[0] || null;
  }, [state, selectedDay]);

  const selectedStatus = useMemo(() => {
    if (state.status !== 'ready' || !selectedTemplate) return null;
    return state.journey.dayStatuses.find((item) => item.day === selectedTemplate.day) || null;
  }, [state, selectedTemplate]);

  useEffect(() => {
    if (selectedTemplate) {
      const normalized = normalizeAnswers(selectedTemplate, selectedStatus?.submission?.answers || null);
      setAnswers(normalized);
      setScenarioGrade(selectedStatus?.submission ? gradeScenarioAnswers(selectedTemplate, normalized) : null);
      setScenarioOptionOrder((current) => {
        const next = { ...current };
        selectedTemplate.scenarioQuestions?.forEach((scenario) => {
          const key = `${selectedTemplate.id}:${scenario.id}`;
          if (!next[key]) next[key] = shuffledCopy(scenario.options);
        });
        return next;
      });
      setFormErrors([]);
      setLocalNotice('');
    }
  }, [selectedTemplate?.id, selectedStatus?.submission?.id]);

  useEffect(() => {
    if (!scrollToWorkspaceAfterLoadRef.current || !selectedTemplate) return;
    scrollToWorkspaceAfterLoadRef.current = false;
    window.requestAnimationFrame(() => {
      journeyWorkspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [selectedTemplate?.id]);

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

  const setScenarioAnswer = (scenarioId: string, value: string) => {
    setAnswers((current) => ({
      ...current,
      scenarioAnswers: {
        ...(current.scenarioAnswers && typeof current.scenarioAnswers === 'object' ? current.scenarioAnswers as Record<string, unknown> : {}),
        [scenarioId]: value,
      },
    }));
    setScenarioGrade(null);
    setLocalNotice('');
    setFormErrors((current) => current.filter((error) => error.key !== `scenario:${scenarioId}`));
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
    if (state.status !== 'ready') return;
    if (!isDayAccessible(state.journey, selectedTemplate.day)) {
      setFormErrors([]);
      setLocalNotice(lockedReason(state.journey, selectedTemplate.day));
      return;
    }
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
        if (payload?.scenarioGrade) setScenarioGrade(payload.scenarioGrade as ScenarioGrade);
        const apiErrors = Array.isArray(payload?.errors) ? payload.errors.map((error: string) => ({ key: 'api', message: error })) : [];
        setFormErrors(apiErrors);
        setLocalNotice(payload?.error || 'Please complete the required level fields.');
        return;
      }
      const completedAutomatically = payload?.status === 'completed';
      if (payload?.scenarioGrade) setScenarioGrade(payload.scenarioGrade as ScenarioGrade);
      setMessage(payload?.completionMessage || (payload?.status === 'under_review' ? 'Submitted for admin review.' : 'Level completed.'));
      if (completedAutomatically) scrollToWorkspaceAfterLoadRef.current = true;
      await load({ selectNextActionable: completedAutomatically });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to submit level.');
    } finally {
      setSavingId('');
    }
  };

  const reopenDay = async () => {
    if (!selectedTemplate) return;
    if (state.status !== 'ready') return;
    if (!isDayAccessible(state.journey, selectedTemplate.day)) {
      setFormErrors([]);
      setLocalNotice(lockedReason(state.journey, selectedTemplate.day));
      return;
    }
    setSavingId(`reopen-${selectedTemplate.day}`);
    setMessage('');
    setFormErrors([]);
    setLocalNotice('');
    try {
      const response = await fetch(`/api/journey/day/${selectedTemplate.day}/reopen`, { method: 'POST', credentials: 'include' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || 'Failed to reopen level.');
      setMessage('Level reopened. Update the form and submit again.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to reopen level.');
    } finally {
      setSavingId('');
    }
  };

  if (state.status === 'loading') {
    return (
      <OnboardingLayout title="Operator Journey" subtitle="Loading your Level 1 path and milestone progress..." loading>
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

  if (state.status === 'locked') {
    return (
      <OnboardingLayout
        title="Operator Journey"
        subtitle="The 30-level journey unlocks after the guided onboarding path reaches Step 10 completion."
        progress={state.progress}
        courseProgress={state.courseProgress}
      >
        <section className={styles.emptyInquiryState}>
          <span className={styles.homeStatusPill}>Locked</span>
          <h2>30-level journey unlocks after Step 10.</h2>
          <p>Complete the communication readiness check first. Once Step 10 is done, live inquiries, courses, and the 30-level journey will open in this workspace.</p>
        </section>
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
  const selectedIsLockedPreview = Boolean(selectedTemplate && !isDayAccessible(journey, selectedTemplate.day));
  const selectedIsCompleted = selectedStatus?.status === 'completed';
  const selectedIsUnderReview = selectedStatus?.status === 'under_review' || selectedStatus?.status === 'submitted';
  const selectedIsReadOnly = Boolean(selectedIsLockedPreview || selectedIsCompleted || selectedIsUnderReview);
  const selectedIsResubmission = Boolean(selectedStatus?.submission && ['pending', 'needs_correction'].includes(selectedStatus.status));
  const nextActionableDay = getNextActionableDay(journey);
  const nextActionLabel = journey.completedMilestoneCount >= journey.totalMilestoneCount ? 'Journey complete' : `Level ${nextActionableDay}`;
  const lockedPreviewNotice = selectedIsLockedPreview && selectedTemplate ? `Preview only. ${lockedReason(journey, selectedTemplate.day).replace('opening', 'working on')}` : '';
  const journeyMetricItems = [
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
  ];

  const selectTimelineDay = (day: number) => {
    setSelectedDay(day);
    setFormErrors([]);
    setLocalNotice(isDayAccessible(journey, day) ? '' : lockedReason(journey, day));
  };

  const aside = (
    <section className={styles.sidebarPanel}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sideTitleLike}>Journey snapshot</h2>
          <p className={styles.sectionHint}>Your operator level, course progress, and workflow status in one place.</p>
        </div>
      </div>
      <div className={styles.journeyAsideStack}>
        <div className={styles.journeyAsideItem}><span>Operator level</span><strong>{currentDay ? `Level ${currentDay}` : 'Not started'}</strong></div>
        <div className={styles.journeyAsideItem}><span>Next action</span><strong>{nextActionLabel}</strong></div>
        <div className={styles.journeyAsideItem}><span>Completed levels</span><strong>{journey.completedMilestoneCount}/{journey.totalMilestoneCount}</strong></div>
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
            <h2 className={styles.homeHeroTitle}>{currentDay ? `Level ${currentDay}: build market momentum` : 'Start the 30-level execution path'}</h2>
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
                <p className={styles.sectionHint}>Every item must be confirmed before Level 1 can start.</p>
              </div>
              <span className={styles.pointsBadge}>{checksComplete ? 'Ready' : 'Required'}</span>
            </div>
            <div className={styles.journeyCheckList}>
              {journey.checks.map((check) => {
                const checked = completedCheckSet.has(check.id);
                return (
                  <label key={check.id} className={`${styles.journeyCheckItem} ${checked ? styles.journeyCheckItemDone : ''}`}>
                    <input type="checkbox" checked={checked} disabled={savingCheckIds.has(check.id)} onChange={(event) => toggleCheck(check.id, event.target.checked)} />
                    <span><strong>{check.label}</strong><small>{check.description}</small></span>
                  </label>
                );
              })}
            </div>
          </div>
          <aside className={styles.journeyStartPanel}>
            <p className={styles.kpiLabel}>Start condition</p>
            <p className={styles.kpiValue}>{checksComplete ? 'Ready for Level 1' : 'Finish checklist'}</p>
            <p className={styles.sectionHint}>Your journey begins at Level 1. After it starts, level forms can be submitted, reviewed, corrected, and completed.</p>
            <button type="button" className={styles.primaryButton} disabled={!checksComplete || savingCheckIds.size > 0 || savingId === 'journey-start'} onClick={startJourney}>
              {savingId === 'journey-start' ? <LoadingButtonContent label="Starting…" /> : 'Start Level 1'}
            </button>
          </aside>
        </section>
      ) : (
        <>
          <section className={styles.journeyStatusStrip}>
            <article className={styles.kpiCard}><p className={styles.kpiLabel}>Current operator level</p><p className={styles.kpiValue}>Level {currentDay}</p></article>
            <article className={styles.kpiCard}><p className={styles.kpiLabel}>Next action</p><p className={styles.kpiValue}>{nextActionLabel}</p></article>
            <article className={styles.kpiCard}><p className={styles.kpiLabel}>Milestones done</p><p className={styles.kpiValue}>{journey.completedMilestoneCount}/{journey.totalMilestoneCount}</p></article>
            <article className={styles.kpiCard}><p className={styles.kpiLabel}>30-level path</p><p className={styles.kpiValue}>{dayPercent}% elapsed</p></article>
          </section>

          <details className={styles.journeyProgressDetails}>
            <summary>
              <span>Progress details</span>
              <strong>{journeyMetricItems.filter(([, value]) => Number(value) > 0).length} active metrics</strong>
            </summary>
            <div className={styles.journeyMetricsGrid}>
              {journeyMetricItems.map(([label, value]) => (
                <article key={label} className={styles.journeyMetricCard}><span>{label}</span><strong>{value}</strong></article>
              ))}
            </div>
          </details>

          {selectedTemplate && selectedStatus ? (
            <section ref={journeyWorkspaceRef} className={styles.journeyWorkspace}>
              <div className={styles.journeyDayContent}>
                <div className={styles.journeyOverviewHeader}>
                  <div>
                    <span className={styles.journeyDayBadge}>Level {selectedTemplate.day}</span>
                    <p className={styles.homeHeroEyebrow}>{selectedTemplate.phase} · {selectedTemplate.dayType}</p>
                  </div>
                  <span className={styles.courseBadge}>{selectedIsLockedPreview ? 'Locked preview' : selectedStatus.label}</span>
                </div>
                <h2 className={styles.homeHeroTitle}>{selectedTemplate.title}</h2>
                <p className={styles.calloutText}>{selectedTemplate.description}</p>
                <p className={styles.journeySectionLabel}>What to understand</p>
                <div className={styles.journeyInfoGrid}>
                  <article className={styles.journeyInfoBlock}>
                    <h3>Purpose</h3>
                    <p>{selectedTemplate.purpose}</p>
                  </article>
                  <article className={styles.journeyInfoBlock}>
                    <h3>What to learn</h3>
                    <ul>{selectedTemplate.learn.map((item) => <li key={item}>{item}</li>)}</ul>
                  </article>
                </div>

                <p className={styles.journeySectionLabel}>Follow this guide</p>
                <ol className={styles.journeyGuideList}>
                  {selectedTemplate.tasks.map((task, index) => (
                    <li key={`${task.title}-${index}`} className={styles.journeyGuideStep}>
                      <span className={styles.journeyGuideNumber} aria-hidden="true">{index + 1}</span>
                      <div className={styles.journeyGuideBody}>
                        <h3>{task.title}</h3>
                        <p>{task.instruction}</p>
                        {task.href ? (
                          isExternalHref(task.href) ? (
                            <a href={task.href} className={styles.journeySecondaryLink} target="_blank" rel="noopener noreferrer">
                              {task.actionLabel || 'Open resource'}
                            </a>
                          ) : (
                            <Link
                              href={task.href}
                              className={styles.journeySecondaryLink}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {task.actionLabel || 'Open page'}
                            </Link>
                          )
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>

                <div className={`${styles.journeyInfoBlock} ${styles.journeyRequiredOutput}`}>
                  <h3>Required output</h3>
                  <p>{selectedTemplate.requiredOutput}</p>
                </div>
                {selectedTemplate.day === 1 ? (
                  <SupportContactList
                    title="Available operator support"
                    description="If you have an access or onboarding problem, call or WhatsApp an available support person before submitting Level 1."
                  />
                ) : null}
              </div>

              <div className={`${styles.journeyFormPanel} ${selectedIsLockedPreview ? styles.journeyFormPanelPreview : ''} ${selectedIsReadOnly && !selectedIsLockedPreview ? styles.journeyFormPanelReadOnly : ''}`}>
                <div className={styles.journeyFormHeader}>
                  <div>
                    <h2 className={styles.courseCardTitle}>{selectedIsLockedPreview ? 'Level submission preview' : 'Level submission'}</h2>
                    <p className={styles.sectionHint}>
                      {selectedIsLockedPreview
                        ? 'You can review the form requirements now. Editing unlocks after earlier levels are completed.'
                        : selectedTemplate.reviewRequired
                          ? 'This level requires admin review after submission.'
                          : 'Complete the required fields below. This level completes automatically when validation passes.'}
                    </p>
                  </div>
                  <span className={styles.pointsBadge}>{categoryLabel(selectedTemplate.category)}</span>
                </div>

                {selectedIsLockedPreview ? (
                  <div className={styles.journeyPreviewNotice} role="note">
                    <strong>{lockedPreviewNotice}</strong>
                    <p>This form unlocks after earlier required levels are completed.</p>
                  </div>
                ) : null}

                {selectedTemplate.scenarioQuestions?.length ? (
                  <section className={styles.journeyScenarioAssessment} aria-labelledby={`scenario-heading-${selectedTemplate.day}`}>
                    <div className={styles.journeyScenarioHeader}>
                      <div>
                        <p className={styles.journeySectionLabel}>Applied scenarios</p>
                        <h3 id={`scenario-heading-${selectedTemplate.day}`}>Choose the best Incoterms® 2020 answer</h3>
                        <p>Answer all {selectedTemplate.scenarioQuestions.length} scenarios. A score of {selectedTemplate.scenarioPassScore || selectedTemplate.scenarioQuestions.length}/{selectedTemplate.scenarioQuestions.length} is required.</p>
                      </div>
                      {scenarioGrade ? (
                        <span className={`${styles.journeyScenarioScore} ${scenarioGrade.passed ? styles.journeyScenarioScorePassed : styles.journeyScenarioScoreRetry}`}>
                          {scenarioGrade.score}/{scenarioGrade.total}
                        </span>
                      ) : null}
                    </div>

                    <div className={styles.journeyScenarioList}>
                      {selectedTemplate.scenarioQuestions.map((scenario, index) => {
                        const scenarioAnswers = answers.scenarioAnswers && typeof answers.scenarioAnswers === 'object'
                          ? answers.scenarioAnswers as Record<string, unknown>
                          : {};
                        const selectedAnswer = String(scenarioAnswers[scenario.id] || '');
                        const result = scenarioGrade?.results.find((item) => item.id === scenario.id);
                        const invalid = !selectedIsLockedPreview && formErrorKeys.has(`scenario:${scenario.id}`);
                        return (
                          <fieldset
                            key={scenario.id}
                            data-field-key={`scenario:${scenario.id}`}
                            className={`${styles.journeyScenarioCard} ${invalid ? styles.journeyFieldInvalid : ''} ${result?.correct ? styles.journeyScenarioCardCorrect : result ? styles.journeyScenarioCardIncorrect : ''}`}
                          >
                            <legend><span>Scenario {index + 1}</span>{scenario.title}</legend>
                            <p className={styles.journeyScenarioSituation}>{scenario.situation}</p>
                            <p className={styles.journeyScenarioQuestion}>{scenario.question}</p>
                            <div className={styles.journeyScenarioOptions}>
                              {(scenarioOptionOrder[`${selectedTemplate.id}:${scenario.id}`] || scenario.options).map((option) => (
                                <label key={option} className={`${styles.journeyScenarioOption} ${selectedAnswer === option ? styles.journeyScenarioOptionSelected : ''}`}>
                                  <input
                                    type="radio"
                                    name={`scenario-${scenario.id}`}
                                    value={option}
                                    checked={selectedAnswer === option}
                                    onChange={() => setScenarioAnswer(scenario.id, option)}
                                    disabled={selectedIsReadOnly}
                                  />
                                  <span>{option}</span>
                                </label>
                              ))}
                            </div>
                            {result ? (
                              <div className={`${styles.journeyScenarioFeedback} ${result.correct ? styles.journeyScenarioFeedbackCorrect : styles.journeyScenarioFeedbackIncorrect}`} role="status">
                                <strong>{result.correct ? 'Correct' : `Review: ${result.correctAnswer}`}</strong>
                                <p>{result.explanation}</p>
                              </div>
                            ) : null}
                          </fieldset>
                        );
                      })}
                    </div>
                  </section>
                ) : null}

                <div className={styles.journeyFormGrid}>
                  {selectedTemplate.formFields.map((field) => (
                    <label key={field.id} className={`${styles.journeyField} ${field.type === 'textarea' ? styles.journeyFieldWide : ''} ${!selectedIsLockedPreview && formErrorKeys.has(fieldKey(field.id)) ? styles.journeyFieldInvalid : ''}`}>
                      <span>{field.label}{field.required ? ' *' : ''}</span>
                      <FieldInput
                        field={field}
                        value={answers[field.id]}
                        onChange={(value) => setField(field.id, value)}
                        invalid={!selectedIsLockedPreview && formErrorKeys.has(fieldKey(field.id))}
                        inputKey={fieldKey(field.id)}
                        disabled={selectedIsReadOnly}
                      />
                    </label>
                  ))}
                </div>

                {selectedTemplate.repeatGroups.map((group) => {
                  const entries = Array.isArray(answers[group.id]) ? answers[group.id] as Record<string, unknown>[] : [];
                  return (
                    <section key={group.id} className={`${styles.journeyRepeatGroup} ${!selectedIsLockedPreview && formErrorKeys.has(`group:${group.id}`) ? styles.journeyFieldInvalid : ''}`}>
                      <div className={styles.sectionHeader}>
                        <div>
                          <h3 className={styles.journeyMilestoneTitle}>{group.label}</h3>
                          <p className={styles.sectionHint}>Minimum {group.minEntries} entries required.</p>
                        </div>
                        <button type="button" className={styles.secondaryButton} disabled={selectedIsReadOnly} onClick={() => addGroupEntry(group)}>Add entry</button>
                      </div>
                      {entries.map((entry, index) => (
                        <article key={`${group.id}-${index}`} className={styles.journeyRepeatEntry}>
                          <p className={styles.kpiLabel}>Entry {index + 1}</p>
                          <div className={styles.journeyFormGrid}>
                            {group.fields.map((field) => (
                              <label key={field.id} className={`${styles.journeyField} ${field.type === 'textarea' ? styles.journeyFieldWide : ''} ${!selectedIsLockedPreview && formErrorKeys.has(groupFieldKey(group.id, index, field.id)) ? styles.journeyFieldInvalid : ''}`}>
                                <span>{field.label}{field.required ? ' *' : ''}</span>
                                <FieldInput
                                  field={field}
                                  value={entry[field.id]}
                                  onChange={(value) => setGroupField(group, index, field.id, value)}
                                  invalid={!selectedIsLockedPreview && formErrorKeys.has(groupFieldKey(group.id, index, field.id))}
                                  inputKey={groupFieldKey(group.id, index, field.id)}
                                  disabled={selectedIsReadOnly}
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

                {!selectedIsLockedPreview && formErrors.length ? (
                  <div className={styles.journeyInlineWarning} role="alert">
                    <strong>{localNotice || `Complete ${formErrors.length} required ${formErrors.length === 1 ? 'field' : 'fields'} before submitting.`}</strong>
                    <ul>
                      {formErrors.slice(0, 5).map((error, index) => <li key={`${error.key}-${index}`}>{error.message}</li>)}
                    </ul>
                    {formErrors.length > 5 ? <p>And {formErrors.length - 5} more required {formErrors.length - 5 === 1 ? 'item' : 'items'}.</p> : null}
                  </div>
                ) : null}

                {selectedIsLockedPreview ? (
                  <div className={styles.journeySubmitFooter}>
                    <p className={styles.journeySubmitHint}>This form unlocks after earlier required levels are completed.</p>
                  </div>
                ) : (
                  <div className={styles.journeySubmitFooter}>
                    <p className={styles.journeySubmitHint}>
                      {selectedIsUnderReview
                        ? 'Waiting for review. This submission is read-only until an admin responds.'
                        : selectedIsCompleted
                          ? 'Completed. Reopen this level only if you need to make a correction.'
                          : 'Fill all required fields to confirm this level.'}
                    </p>

                    <div className={styles.journeySubmitActions}>
                      {!selectedIsCompleted && !selectedIsUnderReview ? (
                        <button type="button" className={styles.primaryButton} disabled={savingId === `submit-${selectedTemplate.day}`} onClick={submitDay}>
                          {savingId === `submit-${selectedTemplate.day}`
                            ? <LoadingButtonContent label={selectedIsResubmission ? 'Resubmitting…' : 'Submitting…'} />
                            : selectedIsResubmission
                              ? `Resubmit ${selectedTemplate.buttonText.replace(/^Complete\s+/i, '')}`
                              : selectedTemplate.buttonText}
                        </button>
                      ) : null}
                      {selectedIsCompleted ? (
                        <button type="button" className={styles.secondaryButton} disabled={savingId === `reopen-${selectedTemplate.day}`} onClick={reopenDay}>
                          {savingId === `reopen-${selectedTemplate.day}` ? <LoadingButtonContent label="Reopening…" /> : 'Reopen to edit'}
                        </button>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            </section>
          ) : null}

          <section className={styles.journeyTimelinePanel} aria-label="30-level journey timeline">
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.courseCardTitle}>30-level journey</h2>
                <p className={styles.sectionHint}>Complete each level in order. Locked levels will open after earlier required levels are completed.</p>
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
                const isNextActionable = item.day === nextActionableDay && !done && !locked;
                const displayLabel = locked
                  ? 'Locked'
                  : isNextActionable && ['upcoming', 'today', 'pending'].includes(item.status)
                    ? 'Next level'
                    : item.label;
                const className = `${styles.journeyTimelineItem} ${done ? styles.journeyTimelineItemDone : ''} ${isToday && !locked ? styles.journeyTimelineItemToday : ''} ${isNextActionable ? styles.journeyTimelineItemNext : ''} ${needsAttention && !locked ? styles.journeyTimelineItemDue : ''} ${isSelected ? styles.journeyTimelineItemSelected : ''} ${locked ? styles.journeyTimelineItemLocked : ''}`;
                return (
                  <button
                    key={item.templateId}
                    type="button"
                    className={className}
                    aria-current={isSelected ? 'step' : undefined}
                    aria-label={`Level ${item.day}: ${displayLabel}${isSelected ? ', selected' : ''}${locked ? ', preview available' : ''}`}
                    title={locked ? `${lockedReason(journey, item.day)} You can preview this level now.` : displayLabel}
                    onClick={() => selectTimelineDay(item.day)}
                  >
                    <span>Level {item.day}</span>
                    <strong>{displayLabel}</strong>
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
