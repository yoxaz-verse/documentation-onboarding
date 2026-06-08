import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from './AuthGate.module.css';

type AdminUser = {
  username: string;
};

type AdminGateProps = {
  children: (user: AdminUser) => JSX.Element;
};

export default function AdminGate({ children }: AdminGateProps) {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadSession = async () => {
      try {
        const response = await fetch('/api/admin/auth/session', {
          credentials: 'include',
          cache: 'no-store',
        });

        let payload: { authenticated?: boolean; user?: AdminUser } = {};
        try {
          payload = await response.json();
        } catch {
          payload = {};
        }

        if (!active) return;

        if (response.status === 401) {
          router.replace('/admin/login');
          return;
        }

        if (!response.ok || !payload.authenticated) {
          router.replace('/admin/login?auth_error=session_check_failed');
          return;
        }

        setUser(payload.user || null);
      } catch {
        if (!active) return;
        router.replace('/admin/login?auth_error=session_check_failed');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadSession();

    return () => {
      active = false;
    };
  }, [router]);

  if (loading) {
    return (
      <main className={styles.loadingPage} role="status" aria-live="polite" aria-busy="true">
        <div className={styles.glowA} aria-hidden="true" />
        <div className={styles.glowB} aria-hidden="true" />
        <section className={styles.statusCard}>
          <div className={styles.statusRow}>
            <span className={styles.spinner} aria-hidden="true" />
            <h1 className={styles.heading}>Checking admin session</h1>
          </div>
          <p className={styles.message}>Opening admin dashboard...</p>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className={styles.loadingPage} role="status" aria-live="polite" aria-busy="false">
        <div className={styles.glowA} aria-hidden="true" />
        <div className={styles.glowB} aria-hidden="true" />
        <section className={styles.statusCard}>
          <div className={styles.statusRow}>
            <span className={styles.spinner} aria-hidden="true" />
            <h1 className={styles.heading}>Redirecting to admin login</h1>
          </div>
          <p className={styles.message}>Please sign in with admin credentials.</p>
        </section>
      </main>
    );
  }

  return children(user);
}
