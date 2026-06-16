import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import AdminGate from '../../components/AdminGate';
import ThemeToggle from '../../components/theme/ThemeToggle';
import type { AdminOperatorRow, AdminOverview } from '../../lib/adminTypes';
import styles from './admin.module.css';

function formatDate(value: string | null) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString();
}

function DashboardContent() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [operators, setOperators] = useState<AdminOperatorRow[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [overviewResponse, operatorsResponse] = await Promise.all([
          fetch('/api/admin/overview', { credentials: 'include', cache: 'no-store' }),
          fetch(`/api/admin/operators?page=${page}&pageSize=20&q=${encodeURIComponent(query)}`, { credentials: 'include', cache: 'no-store' }),
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
  }, [page, query]);

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
                    <td colSpan={7} className={styles.emptyState}>No operators found.</td>
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
