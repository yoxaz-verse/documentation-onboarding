import Link from 'next/link';
import { useEffect, useState } from 'react';
import AdminGate from '../../components/AdminGate';
import ThemeToggle from '../../components/theme/ThemeToggle';
import { JOURNEY_TOTAL_DAYS, type JourneyDayTemplate, type JourneyMilestoneCategory, type JourneySubmissionStatus } from '../../config/operatorJourney';
import styles from './admin.module.css';

const CATEGORY_OPTIONS: JourneyMilestoneCategory[] = ['setup', 'learning', 'outreach', 'platform', 'deal'];
const REVIEW_STATUSES: Array<JourneySubmissionStatus | ''> = ['', 'under_review', 'needs_correction', 'completed'];

type Submission = {
  id: string;
  email: string;
  template_id: string;
  day_number: number;
  status: JourneySubmissionStatus;
  answers: Record<string, unknown>;
  computed_metrics: Record<string, unknown>;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_note: string | null;
};

function jsonText(value: unknown) {
  return JSON.stringify(value || [], null, 2);
}

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function emptyDay(day: number): JourneyDayTemplate {
  return {
    id: `day-${day}-custom`,
    day,
    title: '',
    description: '',
    category: 'learning',
    phase: '',
    dayType: '',
    purpose: '',
    learn: [],
    tasks: [],
    requiredOutput: '',
    buttonText: 'Submit Day',
    completionMessage: '',
    reviewRequired: day >= 11,
    formFields: [],
    repeatGroups: [],
    isActive: true,
  };
}

function JourneyTemplateEditor() {
  const [milestones, setMilestones] = useState<JourneyDayTemplate[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [statusFilter, setStatusFilter] = useState<JourneySubmissionStatus | ''>('under_review');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [readinessStatuses, setReadinessStatuses] = useState<Record<string, string>>({});

  const loadTemplates = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/journey/template', { credentials: 'include', cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || 'Failed to load journey template.');
      const loaded = (payload.milestones || []) as JourneyDayTemplate[];
      setMilestones(Array.from({ length: JOURNEY_TOTAL_DAYS }, (_, index) => loaded.find((item) => item.day === index + 1) || emptyDay(index + 1)));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load journey template.');
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async (status = statusFilter) => {
    try {
      const query = status ? `?status=${encodeURIComponent(status)}` : '';
      const response = await fetch(`/api/admin/journey/submissions${query}`, { credentials: 'include', cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || 'Failed to load submissions.');
      setSubmissions((payload.submissions || []) as Submission[]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load submissions.');
    }
  };

  useEffect(() => {
    loadTemplates();
    loadSubmissions();
  }, []);

  const updateMilestone = (day: number, patch: Partial<JourneyDayTemplate>) => {
    setMilestones((current) => current.map((milestone) => (milestone.day === day ? { ...milestone, ...patch } : milestone)));
    setMessage('');
    setError('');
  };

  const save = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const response = await fetch('/api/admin/journey/template', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ milestones }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || 'Failed to save journey template.');
      setMilestones((payload.milestones || []) as JourneyDayTemplate[]);
      setMessage('Journey template saved. Operators will see the updated workflow on their next load.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save journey template.');
    } finally {
      setSaving(false);
    }
  };

  const reviewSubmission = async (submission: Submission, action: 'approve' | 'needs_correction') => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const response = await fetch(`/api/admin/journey/submissions/${submission.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action,
          reviewNote: reviewNotes[submission.id] || '',
          readinessStatus: readinessStatuses[submission.id] || '',
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || 'Failed to review submission.');
      setMessage(action === 'approve' ? 'Submission approved.' : 'Correction requested.');
      await loadSubmissions();
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Failed to review submission.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className={styles.shell}>
      <div className={styles.bgOrbA} aria-hidden="true" />
      <div className={styles.bgOrbB} aria-hidden="true" />
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headingBlock}>
            <p className={styles.kicker}>Journey Template</p>
            <h1 className={styles.title}>30-Day Operator Execution Path</h1>
            <p className={styles.subtitle}>Edit rich daily content, form schemas, validation metadata, and review operator submissions.</p>
          </div>
          <div className={styles.actions}>
            <Link className={styles.linkButton} href="/admin">Dashboard</Link>
            <ThemeToggle size="sm" variant="surface" />
            <button className={styles.actionButton} type="button" onClick={save} disabled={loading || saving}>{saving ? 'Saving...' : 'Save template'}</button>
          </div>
        </header>

        {error ? <article className={styles.card}>{error}</article> : null}
        {message ? <article className={styles.card}>{message}</article> : null}

        <section className={styles.tableSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.funnelTitle}>Submission review queue</h2>
            <div className={styles.actions}>
              <select
                value={statusFilter}
                onChange={(event) => {
                  const status = event.target.value as JourneySubmissionStatus | '';
                  setStatusFilter(status);
                  loadSubmissions(status);
                }}
              >
                {REVIEW_STATUSES.map((status) => <option key={status || 'all'} value={status}>{status || 'all statuses'}</option>)}
              </select>
              <button className={styles.linkButton} type="button" onClick={() => loadSubmissions()}>Refresh</button>
            </div>
          </div>

          <div className={styles.journeyEditorList}>
            {submissions.length ? submissions.map((submission) => (
              <article key={submission.id} className={styles.journeyEditorCard}>
                <div className={styles.journeyEditorDay}>
                  <span className={styles.timelineStepNumber}>{submission.day_number}</span>
                  <span className={submission.status === 'completed' ? styles.badgeDone : styles.badgePending}>{submission.status.replace('_', ' ')}</span>
                </div>
                <div className={styles.journeyEditorFields}>
                  <div className={styles.adminInputGroup}>
                    <span>Operator</span>
                    <input value={submission.email} readOnly />
                  </div>
                  <div className={styles.adminInputGroup}>
                    <span>Submitted</span>
                    <input value={submission.submitted_at || ''} readOnly />
                  </div>
                  <label className={`${styles.adminInputGroup} ${styles.adminInputWide}`}>
                    <span>Answers</span>
                    <textarea value={JSON.stringify(submission.answers || {}, null, 2)} readOnly rows={8} />
                  </label>
                  {submission.day_number === 30 ? (
                    <label className={styles.adminInputGroup}>
                      <span>Final readiness status</span>
                      <select value={readinessStatuses[submission.id] || ''} onChange={(event) => setReadinessStatuses((current) => ({ ...current, [submission.id]: event.target.value }))}>
                        <option value="">Select</option>
                        {['Execution-ready operator', 'Needs guided supervision', 'Supplier-side strong', 'Buyer-side strong', 'Product research strong', 'Data discipline strong', 'Quotation support strong', 'Follow-up strong', 'Cluster coordination strong', 'Needs more training', 'Not ready currently'].map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </label>
                  ) : null}
                  <label className={`${styles.adminInputGroup} ${styles.adminInputWide}`}>
                    <span>Review note</span>
                    <textarea value={reviewNotes[submission.id] || ''} onChange={(event) => setReviewNotes((current) => ({ ...current, [submission.id]: event.target.value }))} rows={3} placeholder="Required when requesting correction" />
                  </label>
                  <div className={styles.actions}>
                    <button className={styles.actionButton} type="button" disabled={saving} onClick={() => reviewSubmission(submission, 'approve')}>Approve</button>
                    <button className={styles.linkButton} type="button" disabled={saving} onClick={() => reviewSubmission(submission, 'needs_correction')}>Needs correction</button>
                  </div>
                </div>
              </article>
            )) : <p className={styles.emptyState}>No submissions match this filter.</p>}
          </div>
        </section>

        <section className={styles.tableSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.funnelTitle}>Daily template editor</h2>
            <p className={styles.sectionMeta}>{JOURNEY_TOTAL_DAYS} global days</p>
          </div>

          {loading ? (
            <p className={styles.emptyState}>Loading journey template...</p>
          ) : (
            <div className={styles.journeyEditorList}>
              {milestones.map((milestone) => (
                <article key={milestone.id} className={styles.journeyEditorCard}>
                  <div className={styles.journeyEditorDay}>
                    <span className={styles.timelineStepNumber}>{milestone.day}</span>
                    <label className={styles.journeyEditorToggle}>
                      <input type="checkbox" checked={milestone.isActive !== false} onChange={(event) => updateMilestone(milestone.day, { isActive: event.target.checked })} />
                      Active
                    </label>
                    <label className={styles.journeyEditorToggle}>
                      <input type="checkbox" checked={milestone.reviewRequired} onChange={(event) => updateMilestone(milestone.day, { reviewRequired: event.target.checked })} />
                      Review
                    </label>
                  </div>

                  <div className={styles.journeyEditorFields}>
                    <label className={styles.adminInputGroup}><span>Title</span><input value={milestone.title} onChange={(event) => updateMilestone(milestone.day, { title: event.target.value })} /></label>
                    <label className={styles.adminInputGroup}><span>Category</span><select value={milestone.category} onChange={(event) => updateMilestone(milestone.day, { category: event.target.value as JourneyMilestoneCategory })}>{CATEGORY_OPTIONS.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
                    <label className={styles.adminInputGroup}><span>Phase</span><input value={milestone.phase} onChange={(event) => updateMilestone(milestone.day, { phase: event.target.value })} /></label>
                    <label className={styles.adminInputGroup}><span>Day type</span><input value={milestone.dayType} onChange={(event) => updateMilestone(milestone.day, { dayType: event.target.value })} /></label>
                    <label className={`${styles.adminInputGroup} ${styles.adminInputWide}`}><span>Description</span><textarea value={milestone.description} onChange={(event) => updateMilestone(milestone.day, { description: event.target.value })} rows={2} /></label>
                    <label className={`${styles.adminInputGroup} ${styles.adminInputWide}`}><span>Purpose</span><textarea value={milestone.purpose} onChange={(event) => updateMilestone(milestone.day, { purpose: event.target.value })} rows={3} /></label>
                    <label className={`${styles.adminInputGroup} ${styles.adminInputWide}`}><span>Learn JSON</span><textarea value={jsonText(milestone.learn)} onChange={(event) => updateMilestone(milestone.day, { learn: parseJson<string[]>(event.target.value, milestone.learn) })} rows={4} /></label>
                    <label className={`${styles.adminInputGroup} ${styles.adminInputWide}`}><span>Tasks JSON</span><textarea value={jsonText(milestone.tasks)} onChange={(event) => updateMilestone(milestone.day, { tasks: parseJson<string[]>(event.target.value, milestone.tasks) })} rows={4} /></label>
                    <label className={`${styles.adminInputGroup} ${styles.adminInputWide}`}><span>Required output</span><textarea value={milestone.requiredOutput} onChange={(event) => updateMilestone(milestone.day, { requiredOutput: event.target.value })} rows={2} /></label>
                    <label className={styles.adminInputGroup}><span>Button text</span><input value={milestone.buttonText} onChange={(event) => updateMilestone(milestone.day, { buttonText: event.target.value })} /></label>
                    <label className={styles.adminInputGroup}><span>Action link</span><input value={milestone.href || ''} onChange={(event) => updateMilestone(milestone.day, { href: event.target.value })} /></label>
                    <label className={styles.adminInputGroup}><span>Action label</span><input value={milestone.actionLabel || ''} onChange={(event) => updateMilestone(milestone.day, { actionLabel: event.target.value })} /></label>
                    <label className={`${styles.adminInputGroup} ${styles.adminInputWide}`}><span>Completion message</span><textarea value={milestone.completionMessage} onChange={(event) => updateMilestone(milestone.day, { completionMessage: event.target.value })} rows={2} /></label>
                    <label className={`${styles.adminInputGroup} ${styles.adminInputWide}`}><span>Form fields JSON</span><textarea value={jsonText(milestone.formFields)} onChange={(event) => updateMilestone(milestone.day, { formFields: parseJson(event.target.value, milestone.formFields) })} rows={6} /></label>
                    <label className={`${styles.adminInputGroup} ${styles.adminInputWide}`}><span>Repeat groups JSON</span><textarea value={jsonText(milestone.repeatGroups)} onChange={(event) => updateMilestone(milestone.day, { repeatGroups: parseJson(event.target.value, milestone.repeatGroups) })} rows={8} /></label>
                    <label className={`${styles.adminInputGroup} ${styles.adminInputWide}`}><span>Keyword rules JSON</span><textarea value={jsonText(milestone.keywordRules || [])} onChange={(event) => updateMilestone(milestone.day, { keywordRules: parseJson(event.target.value, milestone.keywordRules || []) })} rows={4} /></label>
                    <label className={`${styles.adminInputGroup} ${styles.adminInputWide}`}><span>Metric maps JSON</span><textarea value={jsonText(milestone.metricMaps || [])} onChange={(event) => updateMilestone(milestone.day, { metricMaps: parseJson(event.target.value, milestone.metricMaps || []) })} rows={4} /></label>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default function AdminJourneyPage() {
  return <AdminGate>{() => <JourneyTemplateEditor />}</AdminGate>;
}
