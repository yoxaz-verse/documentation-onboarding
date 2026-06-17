import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import AdminGate from '../../components/AdminGate';
import ThemeToggle from '../../components/theme/ThemeToggle';
import type { AdminJourneyTrackStatus, AdminOnboardingStepStatus, AdminOperatorRow, AdminOverview } from '../../lib/adminTypes';
import styles from './admin.module.css';

function formatDate(value: string | null) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString();
}

function journeyStatusLabel(status: AdminJourneyTrackStatus) {
  if (status === 'not_started') return 'Not started';
  if (status === 'ahead') return 'Ahead';
  if (status === 'on_track') return 'On track';
  if (status === 'behind') return 'Behind';
  if (status === 'short_inactive') return 'Quiet 2+ days';
  if (status === 'serious_inactive') return 'Needs follow-up 4+ days';
  if (status === 'under_review') return 'Under review';
  if (status === 'needs_correction') return 'Needs correction';
  return 'Completed';
}

function statusBadgeClass(status: AdminJourneyTrackStatus) {
  if (['ahead', 'on_track', 'completed'].includes(status)) return styles.badgeDone;
  return styles.badgePending;
}

const JOURNEY_STATUSES: AdminJourneyTrackStatus[] = ['not_started', 'ahead', 'on_track', 'behind', 'short_inactive', 'serious_inactive', 'under_review', 'needs_correction', 'completed'];
const STEP_STATES: AdminOnboardingStepStatus[] = ['completed', 'current', 'not_completed'];

function DashboardContent() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [operators, setOperators] = useState<AdminOperatorRow[]>([]);
  const [query, setQuery] = useState('');
  const [stepFilter, setStepFilter] = useState('');
  const [stepStateFilter, setStepStateFilter] = useState('');
  const [journeyDayFilter, setJourneyDayFilter] = useState('');
  const [journeyStatusFilter, setJourneyStatusFilter] = useState('');
  const [submissionStatusFilter, setSubmissionStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: '20',
          q: query,
        });
        if (stepFilter) params.set('step', stepFilter);
        if (stepStateFilter) params.set('stepState', stepStateFilter);
        if (journeyDayFilter) params.set('journeyDay', journeyDayFilter);
        if (journeyStatusFilter) params.set('journeyStatus', journeyStatusFilter);
        if (submissionStatusFilter) params.set('submissionStatus', submissionStatusFilter);

        const [overviewResponse, operatorsResponse] = await Promise.all([
          fetch('/api/admin/overview', { credentials: 'include', cache: 'no-store' }),
          fetch(`/api/admin/operators?${params.toString()}`, { credentials: 'include', cache: 'no-store' }),
        ]);

        const overviewPayload = await overviewResponse.json().catch(() => ({}));
        const operatorsPayload = await operatorsResponse.json().catch(() => ({}));

        if (overviewResponse.ok) setOverview(overviewPayload.overview || null);
        if (operatorsResponse.ok) {
          setOperators(operatorsPayload.operators || []);
          setTotalPages(operatorsPayload.pagination?.totalPages || 1);
          setTotal(operatorsPayload.pagination?.total || 0);
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [page, query, stepFilter, stepStateFilter, journeyDayFilter, journeyStatusFilter, submissionStatusFilter]);

  const funnelRows = useMemo(() => {
    if (!overview) return [];
    const totalSafe = overview.totalOperators || 1;
    return overview.stepCompletion.map((item) => ({
      label: `Step ${item.step}`,
      meta: item.label,
      value: item.count,
      pct: Math.round((item.count / totalSafe) * 100),
    }));
  }, [overview]);

  const attentionCount = useMemo(
    () => operators.filter((row) => row.currentStep <= 10 && row.submissionStatus !== 'completed').length,
    [operators]
  );

  const applyJourneyStatusFilter = (status: AdminJourneyTrackStatus) => {
    setPage(1);
    setJourneyStatusFilter(status);
  };

  const applyJourneyDayFilter = (day: number) => {
    setPage(1);
    setJourneyDayFilter(String(day));
  };

  const clearFilters = () => {
    setPage(1);
    setQuery('');
    setStepFilter('');
    setStepStateFilter('');
    setJourneyDayFilter('');
    setJourneyStatusFilter('');
    setSubmissionStatusFilter('');
  };

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST', credentials: 'include' });
    window.location.href = '/admin/login';
  };

  return (
    <main className={styles.shell}>
      <div className={styles.bgOrbA} aria-hidden="true" />
      <div className={styles.bgOrbB} aria-hidden="true" />
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headingBlock}>
            <p className={styles.kicker}>Operations Overview</p>
            <h1 className={styles.title}>Admin Dashboard</h1>
            <p className={styles.subtitle}>Monitor the guided operator onboarding funnel and course unlock readiness in real time.</p>
          </div>
          <div className={styles.actions}>
            <Link className={styles.linkButton} href="/admin/journey">Edit Journey</Link>
            <Link className={styles.linkButton} href="/">Operator View</Link>
            <ThemeToggle size="sm" variant="surface" />
            <button className={styles.actionButton} onClick={handleLogout} type="button">Logout</button>
          </div>
        </header>

        <section className={styles.grid}>
          <article className={styles.card}>
            <p className={styles.cardLabel}>Total Operators</p>
            <p className={styles.cardValue}>{overview?.totalOperators ?? 0}</p>
          </article>
          <article className={styles.card}>
            <p className={styles.cardLabel}>Completed</p>
            <p className={styles.cardValue}>{overview?.completedOperators ?? 0}</p>
          </article>
          <article className={styles.card}>
            <p className={styles.cardLabel}>In Progress</p>
            <p className={styles.cardValue}>{overview?.inProgressOperators ?? 0}</p>
          </article>
          <article className={styles.card}>
            <p className={styles.cardLabel}>Completion Rate</p>
            <p className={styles.cardValue}>{overview?.completionRate ?? 0}%</p>
          </article>
          <article className={styles.card}>
            <p className={styles.cardLabel}>Visible Rows</p>
            <p className={styles.cardValue}>{total}</p>
          </article>
          <article className={styles.card}>
            <p className={styles.cardLabel}>Needs Attention</p>
            <p className={styles.cardValue}>{attentionCount}</p>
          </article>
        </section>

        <section className={styles.funnel}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.funnelTitle}>Funnel Progress</h2>
            <p className={styles.sectionMeta}>Milestone completion by operator count</p>
          </div>
          {funnelRows.map((row) => (
            <div key={row.label} className={styles.funnelRow}>
              <div className={styles.stepLabelBlock}>
                <span className={styles.stepLabel}>{row.label}</span>
                <span className={styles.stepMeta}>{row.meta}</span>
              </div>
              <div className={styles.barTrack}><div className={styles.barFill} style={{ width: `${row.pct}%` }} /></div>
              <div className={styles.stepValueBlock}>
                <span className={styles.stepValue}>{row.value}</span>
                <span className={styles.stepMeta}>{row.pct}%</span>
              </div>
            </div>
          ))}
        </section>

        <section className={styles.funnel}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.funnelTitle}>30-Day Journey Analytics</h2>
            <p className={styles.sectionMeta}>Operator movement across the execution path</p>
          </div>
          <div className={styles.analyticsGrid}>
            {overview ? [
              { label: 'Started', value: overview.journey.totalStarted, status: 'started' },
              { label: 'Not started', value: overview.journey.notStarted, status: 'not_started' as AdminJourneyTrackStatus },
              { label: 'Ahead', value: overview.journey.ahead, status: 'ahead' as AdminJourneyTrackStatus },
              { label: 'On track', value: overview.journey.onTrack, status: 'on_track' as AdminJourneyTrackStatus },
              { label: 'Behind', value: overview.journey.behind, status: 'behind' as AdminJourneyTrackStatus },
              { label: 'Quiet 2+ days', value: overview.journey.shortInactive, status: 'short_inactive' as AdminJourneyTrackStatus },
              { label: 'Needs follow-up 4+ days', value: overview.journey.seriousInactive, status: 'serious_inactive' as AdminJourneyTrackStatus },
              { label: 'Under review', value: overview.journey.underReview, status: 'under_review' as AdminJourneyTrackStatus },
              { label: 'Needs correction', value: overview.journey.needsCorrection, status: 'needs_correction' as AdminJourneyTrackStatus },
              { label: 'Completed', value: overview.journey.completed, status: 'completed' as AdminJourneyTrackStatus },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                className={`${styles.analyticsCard} ${item.status && journeyStatusFilter === item.status ? styles.analyticsCardActive : ''}`}
                onClick={() => {
                  setPage(1);
                  setJourneyStatusFilter(item.status);
                }}
              >
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </button>
            )) : null}
          </div>
          <div className={styles.dayDistribution}>
            {(overview?.journey.perDay || []).map((item) => (
              <button
                key={item.day}
                type="button"
                className={`${styles.dayPill} ${journeyDayFilter === String(item.day) ? styles.dayPillActive : ''}`}
                onClick={() => applyJourneyDayFilter(item.day)}
                title={`Filter operators on journey Day ${item.day}`}
              >
                <span>D{item.day}</span>
                <strong>{item.count}</strong>
              </button>
            ))}
          </div>
        </section>

        <section className={styles.tableSection}>
          <div className={styles.controls}>
            <label className={styles.searchWrap}>
              <span className={styles.searchIcon} aria-hidden="true">⌕</span>
              <input
                className={styles.search}
                value={query}
                onChange={(event) => {
                  setPage(1);
                  setQuery(event.target.value);
                }}
                placeholder="Search by email or name"
                aria-label="Search by email or name"
              />
            </label>
            <div className={styles.filterGrid}>
              <label className={styles.filterControl}>
                <span>Onboarding step</span>
                <select value={stepFilter} onChange={(event) => { setPage(1); setStepFilter(event.target.value); }}>
                  <option value="">All steps</option>
                  {Array.from({ length: 11 }, (_, index) => index + 1).map((step) => <option key={step} value={step}>Step {step}</option>)}
                </select>
              </label>
              <label className={styles.filterControl}>
                <span>Step state</span>
                <select value={stepStateFilter} onChange={(event) => { setPage(1); setStepStateFilter(event.target.value); }}>
                  <option value="">Any state</option>
                  {STEP_STATES.map((state) => <option key={state} value={state}>{state.replace('_', ' ')}</option>)}
                </select>
              </label>
              <label className={styles.filterControl}>
                <span>Journey day</span>
                <select value={journeyDayFilter} onChange={(event) => { setPage(1); setJourneyDayFilter(event.target.value); }}>
                  <option value="">All days</option>
                  {Array.from({ length: 30 }, (_, index) => index + 1).map((day) => <option key={day} value={day}>Day {day}</option>)}
                </select>
              </label>
              <label className={styles.filterControl}>
                <span>Journey status</span>
                <select value={journeyStatusFilter} onChange={(event) => { setPage(1); setJourneyStatusFilter(event.target.value); }}>
                  <option value="">All statuses</option>
                  {JOURNEY_STATUSES.map((status) => <option key={status} value={status}>{journeyStatusLabel(status)}</option>)}
                </select>
              </label>
              <label className={styles.filterControl}>
                <span>Submission</span>
                <select value={submissionStatusFilter} onChange={(event) => { setPage(1); setSubmissionStatusFilter(event.target.value); }}>
                  <option value="">All submissions</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </label>
              <button className={styles.linkButton} type="button" onClick={clearFilters}>Clear filters</button>
            </div>
            <div className={styles.pager}>
              <button className={styles.actionButton} type="button" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page <= 1}>Prev</button>
              <span className={styles.pageMeta}>Page {page} / {totalPages}</span>
              <button className={styles.actionButton} type="button" onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} disabled={page >= totalPages}>Next</button>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Operator</th>
                  <th>Current Step</th>
                  <th>Completion</th>
                  <th>Journey</th>
                  <th>Journey Status</th>
                  <th>Submission</th>
                  <th>Last Activity</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {operators.map((row) => (
                  <tr key={row.email}>
                    <td>
                      <div className={styles.operatorName}>{row.profileName || row.name || 'Unnamed Operator'}</div>
                      <div className={styles.meta}>{row.email}</div>
                    </td>
                    <td>
                      <div className={styles.operatorName}>Step {Math.min(row.currentStep, 11)}</div>
                      <div className={styles.meta}>{row.currentStep > 11 ? 'Courses unlocked' : 'Onboarding active'}</div>
                    </td>
                    <td>
                      <span className={row.completedMilestones >= 11 ? styles.badgeDone : styles.badgePending}>
                        {row.completedMilestones >= 11 ? 'Completed' : `${row.completedMilestones}/11`}
                      </span>
                    </td>
                    <td>
                      <span className={row.journeyStartedAt ? styles.badgeDone : styles.badgePending}>
                        {row.journeyStartedAt ? `Day ${row.journeyCurrentDay || 1}` : 'Not started'}
                      </span>
                      <div className={styles.meta}>
                        {row.journeyCompletedMilestones}/{row.journeyTotalMilestones} milestones
                      </div>
                    </td>
                    <td>
                      <span className={statusBadgeClass(row.journeyTrackStatus)}>
                        {journeyStatusLabel(row.journeyTrackStatus)}
                      </span>
                      <div className={styles.meta}>
                        {row.journeyActionDay ? `Action day ${row.journeyActionDay}` : 'No action day'}
                        {row.journeyExpectedDay ? ` · Expected ${row.journeyExpectedDay}` : ''}
                      </div>
                      {row.journeyPendingReviewCount || row.journeyNeedsCorrectionCount ? (
                        <div className={styles.meta}>
                          {row.journeyPendingReviewCount ? `${row.journeyPendingReviewCount} review` : ''}
                          {row.journeyPendingReviewCount && row.journeyNeedsCorrectionCount ? ' · ' : ''}
                          {row.journeyNeedsCorrectionCount ? `${row.journeyNeedsCorrectionCount} correction` : ''}
                        </div>
                      ) : null}
                    </td>
                    <td>
                      <span className={row.submissionStatus === 'completed' ? styles.badgeDone : styles.badgePending}>
                        {row.submissionStatus === 'completed' ? 'Completed' : 'Pending'}
                      </span>
                      <div className={styles.meta}>{row.hasCompletionCode ? 'Completion code issued' : 'No completion code'}</div>
                    </td>
                    <td>{formatDate(row.latestActivityAt)}</td>
                    <td><Link className={styles.linkButton} href={`/admin/operators/${encodeURIComponent(row.email)}`}>Open</Link></td>
                  </tr>
                ))}
                {!loading && operators.length === 0 ? (
                  <tr>
                    <td colSpan={8} className={styles.emptyState}>No operators found.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function AdminDashboardPage() {
  return <AdminGate>{() => <DashboardContent />}</AdminGate>;
}
