import Link from 'next/link';
import { useEffect, useState } from 'react';
import AdminGate from '../../components/AdminGate';
import ThemeToggle from '../../components/theme/ThemeToggle';
import { JOURNEY_TOTAL_DAYS, type JourneyMilestone, type JourneyMilestoneCategory } from '../../config/operatorJourney';
import styles from './admin.module.css';

const CATEGORY_OPTIONS: JourneyMilestoneCategory[] = ['setup', 'learning', 'outreach', 'platform', 'deal'];

function emptyDay(day: number): JourneyMilestone {
  return {
    id: `day-${day}-custom`,
    day,
    title: '',
    description: '',
    category: 'learning',
    isActive: true,
  };
}

function JourneyTemplateEditor() {
  const [milestones, setMilestones] = useState<JourneyMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/journey/template', { credentials: 'include', cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || 'Failed to load journey template.');
      const loaded = (payload.milestones || []) as JourneyMilestone[];
      setMilestones(Array.from({ length: JOURNEY_TOTAL_DAYS }, (_, index) => loaded.find((item) => item.day === index + 1) || emptyDay(index + 1)));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load journey template.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateMilestone = (day: number, patch: Partial<JourneyMilestone>) => {
    setMilestones((current) =>
      current.map((milestone) => (milestone.day === day ? { ...milestone, ...patch } : milestone))
    );
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
      setMilestones((payload.milestones || []) as JourneyMilestone[]);
      setMessage('Journey template saved. Operators will see the updated days on their next load.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save journey template.');
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
            <h1 className={styles.title}>30-Day Operator Path</h1>
            <p className={styles.subtitle}>Edit the global daily expectations operators use to stay on track, catch up, or move ahead.</p>
          </div>
          <div className={styles.actions}>
            <Link className={styles.linkButton} href="/admin">Dashboard</Link>
            <ThemeToggle size="sm" variant="surface" />
            <button className={styles.actionButton} type="button" onClick={save} disabled={loading || saving}>
              {saving ? 'Saving...' : 'Save template'}
            </button>
          </div>
        </header>

        {error ? <article className={styles.card}>{error}</article> : null}
        {message ? <article className={styles.card}>{message}</article> : null}

        <section className={styles.tableSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.funnelTitle}>Daily tasks</h2>
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
                      <input
                        type="checkbox"
                        checked={milestone.isActive !== false}
                        onChange={(event) => updateMilestone(milestone.day, { isActive: event.target.checked })}
                      />
                      Active
                    </label>
                  </div>

                  <div className={styles.journeyEditorFields}>
                    <label className={styles.adminInputGroup}>
                      <span>Title</span>
                      <input
                        value={milestone.title}
                        onChange={(event) => updateMilestone(milestone.day, { title: event.target.value })}
                        placeholder={`Day ${milestone.day} task title`}
                      />
                    </label>
                    <label className={styles.adminInputGroup}>
                      <span>Category</span>
                      <select
                        value={milestone.category}
                        onChange={(event) => updateMilestone(milestone.day, { category: event.target.value as JourneyMilestoneCategory })}
                      >
                        {CATEGORY_OPTIONS.map((category) => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </label>
                    <label className={`${styles.adminInputGroup} ${styles.adminInputWide}`}>
                      <span>Description</span>
                      <textarea
                        value={milestone.description}
                        onChange={(event) => updateMilestone(milestone.day, { description: event.target.value })}
                        rows={3}
                        placeholder="What should the operator complete or understand on this day?"
                      />
                    </label>
                    <label className={styles.adminInputGroup}>
                      <span>Action link</span>
                      <input
                        value={milestone.href || ''}
                        onChange={(event) => updateMilestone(milestone.day, { href: event.target.value })}
                        placeholder="/courses"
                      />
                    </label>
                    <label className={styles.adminInputGroup}>
                      <span>Action label</span>
                      <input
                        value={milestone.actionLabel || ''}
                        onChange={(event) => updateMilestone(milestone.day, { actionLabel: event.target.value })}
                        placeholder="Open course"
                      />
                    </label>
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
