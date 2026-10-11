import type { SessionUser } from '../lib/types';
import styles from './AuthGate.module.css';
import LoadingState from './LoadingState';
import { useWorkspace } from '../hooks/useWorkspace';

type AuthGateProps = {
  children: (user: SessionUser) => JSX.Element;
};

export default function AuthGate({ children }: AuthGateProps) {
  const { user, loading, error } = useWorkspace();

  if (loading) {
    return <LoadingState variant="page" title="Opening workspace" message="Loading your session and workspace in one secure request…" />;
  }

  if (!user) {
    return (
      <main className={styles.loadingPage} role="status" aria-live="polite" aria-busy="false">
        <div className={styles.glowA} aria-hidden="true" />
        <div className={styles.glowB} aria-hidden="true" />
        <section className={styles.statusCard}>
          <div className={styles.statusRow}>
          <h1 className={styles.heading}>{error ? 'Workspace unavailable' : 'Redirecting home'}</h1>
          </div>
          <p className={styles.message}>{error ? 'We could not load your workspace right now. Please try again shortly.' : 'Your session ended. Taking you back to the home page…'}</p>
        </section>
      </main>
    );
  }

  return children(user);
}
