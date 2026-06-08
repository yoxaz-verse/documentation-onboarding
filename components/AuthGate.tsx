import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import type { SessionUser } from '../lib/types';
import styles from './AuthGate.module.css';

type AuthGateProps = {
  children: (user: SessionUser) => JSX.Element;
};

const SESSION_CHECK_ATTEMPTS = 3;
const SESSION_CHECK_BACKOFF_MS = [100, 250, 500];

export default function AuthGate({ children }: AuthGateProps) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('Taking you to your onboarding workspace...');
  const [heading, setHeading] = useState('Checking authentication');

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const loadSession = async () => {
      try {
        let lastStatus = 0;
        let lastPayload: { authenticated?: boolean; user?: SessionUser } = {};

        for (let attempt = 0; attempt < SESSION_CHECK_ATTEMPTS; attempt += 1) {
          const response = await fetch('/api/auth/session', {
            signal: controller.signal,
            credentials: 'include',
            cache: 'no-store',
          });
          lastStatus = response.status;
          let payload: { authenticated?: boolean; user?: SessionUser } = {};
          try {
            payload = await response.json();
          } catch {
            payload = {};
          }
          lastPayload = payload;

          if (!active) return;

          if (response.ok && payload.authenticated) {
            setUser(payload.user || null);
            return;
          }

          if (response.status === 401) {
            setHeading('Redirecting home');
            setMessage('Your session ended. Taking you back to the home page...');
            router.replace('/');
            return;
          }

          if (attempt < SESSION_CHECK_ATTEMPTS - 1) {
            setHeading('Retrying authentication');
            setMessage('The session check is temporarily unavailable. Retrying...');
            await wait(SESSION_CHECK_BACKOFF_MS[attempt] || 300);
          }
        }

        if (!active) return;
        if (lastStatus !== 401 || lastPayload.authenticated !== false) {
          setHeading('Authentication unavailable');
          setMessage('We could not verify your session right now. Return home and try again in a moment.');
          return;
        }
      } catch {
        if (!active) return;
        setHeading('Authentication unavailable');
        setMessage('We could not verify your session right now. Return home and try again in a moment.');
      } finally {
        clearTimeout(timeoutId);
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
            <h1 className={styles.heading}>{heading}</h1>
          </div>
          <p className={styles.message}>{message}</p>
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
            <h1 className={styles.heading}>{heading}</h1>
          </div>
          <p className={styles.message}>{message}</p>
        </section>
      </main>
    );
  }

  return children(user);
}
