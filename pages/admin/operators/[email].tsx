import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import AdminGate from '../../../components/AdminGate';
import ThemeToggle from '../../../components/theme/ThemeToggle';
import type { AdminOperatorDetail } from '../../../lib/adminTypes';
import styles from '../admin.module.css';

function formatDate(value: string | null) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString();
}

function toTitleCase(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function DetailContent() {
  const router = useRouter();
  const email = String(router.query.email || '').trim().toLowerCase();
  const [detail, setDetail] = useState<AdminOperatorDetail | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!email || !email.includes('@')) return;

    const load = async () => {
      const response = await fetch(`/api/admin/operators/${encodeURIComponent(email)}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload?.error || 'Failed to load operator detail.');
        return;
      }
      setDetail(payload.detail || null);
    };

    load();
  }, [email]);

  const stepStats = useMemo(() => {
    if (!detail?.progress) {
      return [
        { label: 'Current step', value: 'Step 1' },
        { label: 'Completed milestones', value: '0/11' },
        { label: 'Latest activity', value: 'N/A' },
        { label: 'Submission', value: 'Missing' },
      ];
    }

    return [
      { label: 'Current step', value: `Step ${detail.progress.currentStep}` },
      { label: 'Completed milestones', value: `${detail.progress.completedMilestones}/11` },
      { label: 'Operator journey', value: detail.journey.startedAt ? `Day ${detail.journey.currentDay || 1}` : 'Not started' },
      { label: 'Latest activity', value: formatDate(detail.summary.latestActivityAt) },
      { label: 'Submission', value: toTitleCase(detail.submission?.status || 'missing') },
    ];
  }, [detail]);

  return (
    <main className={styles.shell}>
      <div className={styles.bgOrbA} aria-hidden="true" />
      <div className={styles.bgOrbB} aria-hidden="true" />
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headingBlock}>
            <p className={styles.kicker}>Operator Detail</p>
            <h1 className={styles.title}>{detail?.summary.displayName || 'Operator Detail'}</h1>
            <p className={styles.subtitle}>{email || 'Operator'} · step-by-step onboarding visibility</p>
          </div>
          <div className={styles.actions}>
            <Link className={styles.linkButton} href="/admin">Back to dashboard</Link>
            <ThemeToggle size="sm" variant="surface" />
          </div>
        </header>

        {error ? <article className={styles.card}>{error}</article> : null}
        {!detail && !error ? <article className={styles.card}>Loading operator detail...</article> : null}

        {detail ? (
          <>
            <section className={styles.detailHero}>
              <article className={styles.card}>
                <div className={styles.detailHeroTop}>
                  <div>
                    <p className={styles.cardLabel}>Operator summary</p>
                    <h2 className={styles.detailHeroTitle}>{detail.summary.displayName}</h2>
                    <p className={styles.detailHeroText}>{detail.operator.email}</p>
                  </div>
                  <div className={styles.badgeRow}>
                    <span className={detail.summary.progressState === 'completed' ? styles.badgeDone : styles.badgePending}>
                      {detail.summary.progressState === 'completed' ? 'Onboarding complete' : detail.summary.progressState === 'in_progress' ? 'In progress' : 'Not started'}
                    </span>
                    <span className={detail.summary.submissionState === 'completed' ? styles.badgeDone : styles.badgePending}>
                      {detail.summary.submissionState === 'completed' ? 'Submission complete' : detail.summary.submissionState === 'pending' ? 'Submission pending' : 'Submission missing'}
                    </span>
                  </div>
                </div>

                <div className={styles.detailSummaryGrid}>
                  {stepStats.map((item) => (
                    <div key={item.label} className={styles.detailSummaryCard}>
                      <p className={styles.cardLabel}>{item.label}</p>
                      <p className={styles.detailSummaryValue}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </article>

              <article className={styles.card}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.funnelTitle}>Operator record</h2>
                  <p className={styles.sectionMeta}>Base account fields</p>
                </div>
                <div className={styles.fieldGrid}>
                  <div className={styles.fieldPair}>
                    <span className={styles.fieldLabel}>Name</span>
                    <span className={styles.fieldValue}>{detail.operator.name || 'N/A'}</span>
                  </div>
                  <div className={styles.fieldPair}>
                    <span className={styles.fieldLabel}>Phone</span>
                    <span className={styles.fieldValue}>{detail.operator.phone || 'N/A'}</span>
                  </div>
                  <div className={styles.fieldPair}>
                    <span className={styles.fieldLabel}>Role</span>
                    <span className={styles.fieldValue}>{detail.operator.role || 'N/A'}</span>
                  </div>
                  <div className={styles.fieldPair}>
                    <span className={styles.fieldLabel}>Company</span>
                    <span className={styles.fieldValue}>{detail.operator.company || 'N/A'}</span>
                  </div>
                  <div className={styles.fieldPair}>
                    <span className={styles.fieldLabel}>Timezone</span>
                    <span className={styles.fieldValue}>{detail.operator.timezone || 'N/A'}</span>
                  </div>
                  <div className={styles.fieldPair}>
                    <span className={styles.fieldLabel}>Last updated</span>
                    <span className={styles.fieldValue}>{formatDate(detail.operator.updatedAt)}</span>
                  </div>
                </div>
              </article>
            </section>

            <section className={styles.timelineSection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.funnelTitle}>Onboarding steps</h2>
                <p className={styles.sectionMeta}>What has been captured at each milestone</p>
              </div>
              <div className={styles.timelineList}>
                {detail.stepSections.map((section) => (
                  <article key={section.step} className={styles.timelineCard}>
                    <div className={styles.timelineMarker}>
                      <span className={styles.timelineStepNumber}>{section.step}</span>
                    </div>
                    <div className={styles.timelineBody}>
                      <div className={styles.timelineHeader}>
                        <div>
                          <p className={styles.cardLabel}>Step {section.step}</p>
                          <h3 className={styles.timelineTitle}>{section.label}</h3>
                          <p className={styles.timelineSummary}>{section.summary}</p>
                        </div>
                        <span className={section.status === 'complete' ? styles.badgeDone : styles.badgePending}>
                          {section.statusLabel}
                        </span>
                      </div>
                      <p className={styles.timelineNote}>{section.note}</p>
                      {section.fields.length ? (
                        <div className={styles.fieldGrid}>
                          {section.fields.map((field) => (
                            <div key={`${section.step}-${field.label}`} className={styles.fieldPair}>
                              <span className={styles.fieldLabel}>{field.label}</span>
                              <span className={field.tone === 'muted' ? styles.fieldValueMuted : styles.fieldValue}>{field.value}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className={styles.meta}>No additional stored fields for this step.</p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className={styles.detailGrid}>
              <article className={styles.card}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.funnelTitle}>Final submission</h2>
                  <p className={styles.sectionMeta}>Completion handoff</p>
                </div>
                {detail.submission ? (
                  <div className={styles.fieldGrid}>
                    <div className={styles.fieldPair}>
                      <span className={styles.fieldLabel}>Status</span>
                      <span className={styles.fieldValue}>{toTitleCase(detail.submission.status)}</span>
                    </div>
                    <div className={styles.fieldPair}>
                      <span className={styles.fieldLabel}>Completion code</span>
                      <span className={styles.fieldValue}>{detail.submission.completionCode || 'N/A'}</span>
                    </div>
                    <div className={styles.fieldPair}>
                      <span className={styles.fieldLabel}>Submitted at</span>
                      <span className={styles.fieldValue}>{formatDate(detail.submission.submittedAt)}</span>
                    </div>
                  </div>
                ) : (
                  <p className={styles.meta}>No final submission record yet.</p>
                )}
              </article>

              <article className={styles.card}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.funnelTitle}>Progress record</h2>
                  <p className={styles.sectionMeta}>Milestone sequence</p>
                </div>
                {detail.progress ? (
                  <div className={styles.milestoneStack}>
                    {detail.progress.milestones.map((milestone) => (
                      <div key={milestone.step} className={styles.milestoneRow}>
                        <span className={styles.fieldValue}>Step {milestone.step}</span>
                        <span className={styles.meta}>{milestone.label}</span>
                        <span className={milestone.completed ? styles.badgeDone : styles.badgePending}>
                          {milestone.completed ? 'Done' : detail.progress.currentStep === milestone.step ? 'Current' : 'Pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.meta}>No progress record.</p>
                )}
              </article>

              <article className={styles.card}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.funnelTitle}>Operator journey</h2>
                  <p className={styles.sectionMeta}>30-day milestone path</p>
                </div>
                <div className={styles.fieldGrid}>
                  <div className={styles.fieldPair}>
                    <span className={styles.fieldLabel}>Status</span>
                    <span className={styles.fieldValue}>{detail.journey.startedAt ? `Started · Day ${detail.journey.currentDay || 1}` : 'Not started'}</span>
                  </div>
                  <div className={styles.fieldPair}>
                    <span className={styles.fieldLabel}>Preflight checks</span>
                    <span className={styles.fieldValue}>{detail.journey.completedChecks}/{detail.journey.totalChecks}</span>
                  </div>
                  <div className={styles.fieldPair}>
                    <span className={styles.fieldLabel}>Journey milestones</span>
                    <span className={styles.fieldValue}>{detail.journey.completedMilestones}/{detail.journey.totalMilestones}</span>
                  </div>
                  <div className={styles.fieldPair}>
                    <span className={styles.fieldLabel}>Latest journey activity</span>
                    <span className={styles.fieldValue}>{formatDate(detail.journey.latestActivityAt)}</span>
                  </div>
                </div>
              </article>
            </section>

            <article className={styles.tableSection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.funnelTitle}>Quiz summary</h2>
                <p className={styles.sectionMeta}>Course readiness snapshot</p>
              </div>
              {detail.quizSummary.length ? (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Module</th>
                        <th>Best Score</th>
                        <th>Attempts</th>
                        <th>Status</th>
                        <th>Last Attempt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.quizSummary.map((quiz) => (
                        <tr key={quiz.moduleId}>
                          <td>
                            <div className={styles.operatorName}>{quiz.moduleId}</div>
                          </td>
                          <td>{quiz.bestScore}</td>
                          <td>{quiz.attempts}</td>
                          <td>
                            <span className={quiz.everPassed ? styles.badgeDone : styles.badgePending}>
                              {quiz.everPassed ? 'Passed' : 'Not passed'}
                            </span>
                          </td>
                          <td>{formatDate(quiz.lastAttemptAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className={styles.meta}>No quiz attempts found for this operator.</p>
              )}
            </article>
          </>
        ) : null}
      </div>
    </main>
  );
}

export default function AdminOperatorDetailPage() {
  return <AdminGate>{() => <DetailContent />}</AdminGate>;
}
