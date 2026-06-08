import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import ThemeToggle from '../../components/theme/ThemeToggle';
import styles from './login.module.css';

function getStatusTone(message: string): 'info' | 'success' | 'error' {
  const normalized = message.toLowerCase();
  if (normalized.includes('failed') || normalized.includes('error') || normalized.includes('invalid')) return 'error';
  if (normalized.includes('successful') || normalized.includes('redirecting')) return 'success';
  return 'info';
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const statusTone = useMemo(() => getStatusTone(status), [status]);

  useEffect(() => {
    if (router.query.auth_error === 'session_check_failed') {
      setStatus('Session check failed. Please sign in again.');
    }
  }, [router.query.auth_error]);

  useEffect(() => {
    const checkSession = async () => {
      const response = await fetch('/api/admin/auth/session', { credentials: 'include', cache: 'no-store' });
      if (response.ok) router.replace('/admin');
    };
    checkSession();
  }, [router]);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    if (loading) return;

    if (!username.trim() || !password) {
      setStatus('Username and password are required.');
      return;
    }

    setLoading(true);
    setStatus('Signing in...');

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setStatus(payload?.error || 'Admin login failed.');
        return;
      }

      setStatus('Login successful. Redirecting...');
      router.replace('/admin');
    } catch {
      setStatus('Admin login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.glowA} aria-hidden="true" />
      <div className={styles.glowB} aria-hidden="true" />
      <div className={styles.topControls}>
        <ThemeToggle size="sm" variant="surface" />
      </div>
      <section className={styles.heroLayout}>
        <section className={styles.heroPanel}>
          <p className={styles.brand}>OBAOL</p>
          <p className={styles.heroKicker}>Administration</p>
          <h1 className={styles.heroTitle}>
            <span>Admin Dashboard</span>
            <span>Operator Progress Console</span>
          </h1>
          <p className={styles.heroSubtitle}>Secure admin-only view for onboarding funnel and operator status.</p>
        </section>

        <section className={styles.formPanel}>
          <h2 className={styles.formTitle}>Admin Login</h2>
          <p className={styles.formSubtitle}>Use your admin credentials to continue.</p>
          <form className={styles.form} onSubmit={handleLogin}>
            <label className={styles.label} htmlFor="admin-username">Admin username</label>
            <input
              id="admin-username"
              className={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />

            <label className={styles.label} htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />

            <button className={styles.primaryButton} type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {status ? (
            <p
              className={`${styles.statusBox} ${
                statusTone === 'success' ? styles.statusSuccess : statusTone === 'error' ? styles.statusError : styles.statusInfo
              }`}
              role="status"
            >
              {status}
            </p>
          ) : null}
        </section>
      </section>
    </main>
  );
}
