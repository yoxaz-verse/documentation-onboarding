import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import ThemeToggle from '../../components/theme/ThemeToggle';
import styles from './login.module.css';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function getStatusTone(message: string): 'info' | 'success' | 'error' {
  const normalized = message.toLowerCase();

  if (
    normalized.includes('failed') ||
    normalized.includes('error') ||
    normalized.includes('incorrect') ||
    normalized.includes('invalid') ||
    normalized.includes('exceeded') ||
    normalized.includes('too many')
  ) {
    return 'error';
  }

  if (
    normalized.includes('successful') ||
    normalized.includes('otp sent') ||
    normalized.includes('redirecting')
  ) {
    return 'success';
  }

  return 'info';
}

export default function LoginPage() {
  const RESEND_COOLDOWN_SECONDS = 30;
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(''));
  const [otpRequested, setOtpRequested] = useState(false);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const statusTone = useMemo(() => getStatusTone(status), [status]);
  const displayName = useMemo(() => {
    const localPart = email.split('@')[0] || '';
    const tokens = localPart.split(/[._-]+/).filter(Boolean);
    if (tokens.length === 0) return 'Operator';

    return tokens
      .map((token) => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase())
      .join(' ');
  }, [email]);

  useEffect(() => {
    if (router.query.auth_error === 'session_check_failed') {
      setStatus('Session check failed. Please verify OTP again.');
    }
  }, [router.query.auth_error]);

  useEffect(() => {
    const checkSession = async () => {
      const response = await fetch('/api/auth/session', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (response.ok) router.replace('/');
    };
    checkSession();
  }, [router]);

  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setInterval(() => {
      setResendCooldown((previous) => {
        if (previous <= 1) {
          clearInterval(timer);
          return 0;
        }
        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  const sendOtp = async (normalizedEmail: string, mode: 'initial' | 'resend') => {
    const modeVerb = mode === 'resend' ? 'Resending' : 'Sending';
    if (loading) return false;
    setLoading(true);
    setStatus(`${modeVerb} OTP...`);

    try {
      const response = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setStatus(payload?.error || 'Failed to send OTP.');
        return false;
      }

      setEmail(normalizedEmail);
      setOtpRequested(true);
      setOtpDigits(Array(6).fill(''));
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setStatus(mode === 'resend' ? 'OTP resent. Check your email.' : 'OTP sent. Check your email.');
      return true;
    } catch {
      setStatus('Unable to send OTP right now. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const requestOtp = async (event: FormEvent) => {
    event.preventDefault();
    if (loading) return;

    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setStatus('Please enter a valid work email address.');
      return;
    }

    await sendOtp(normalizedEmail, 'initial');
  };

  const verifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    if (loading) return;

    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setStatus('Please enter a valid work email address.');
      return;
    }

    const otp = otpDigits.join('');
    if (otp.length !== 6) {
      setStatus('Please enter the 6-digit OTP.');
      return;
    }

    setLoading(true);
    setStatus('Verifying OTP...');

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: normalizedEmail, otp }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setStatus(payload?.error || 'OTP verification failed.');
        return;
      }

      setEmail(normalizedEmail);
      setStatus('Login successful. Redirecting...');
      router.replace(payload?.next || '/');
    } catch {
      setStatus('Unable to verify OTP right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpDigitChange = (index: number, value: string) => {
    const normalized = value.replace(/\D/g, '').slice(-1);
    setOtpDigits((previous) => {
      const next = [...previous];
      next[index] = normalized;
      return next;
    });

    if (normalized && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, key: string) => {
    if (key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const nextDigits = Array(6)
      .fill('')
      .map((_, index) => pasted[index] ?? '');
    setOtpDigits(nextDigits);

    const focusIndex = Math.min(pasted.length, 5);
    otpInputRefs.current[focusIndex]?.focus();
  };

  const resendOtp = async () => {
    if (loading || resendCooldown > 0) return;
    const normalizedEmail = email.trim().toLowerCase();
    await sendOtp(normalizedEmail, 'resend');
  };

  const resendLabel =
    resendCooldown > 0
      ? `Resend in 00:${String(resendCooldown).padStart(2, '0')}`
      : 'Resend OTP';

  return (
    <main className={styles.page}>
      <div className={styles.glowA} aria-hidden="true" />
      <div className={styles.glowB} aria-hidden="true" />
      <div className={styles.topControls}>
        <ThemeToggle size="sm" variant="surface" />
      </div>
      <section className={styles.heroLayout} aria-label="Operator onboarding and login">
        <section className={styles.heroPanel} aria-label="Operator onboarding overview">
          <p className={styles.brand}>OBAOL</p>
          <p className={styles.heroKicker}>Operator workspace</p>
          <h1 className={styles.heroTitle}>
            <span>One workspace.</span>
            <span>Everything an operator needs.</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Enter a guided operator workspace built for onboarding steps, profile readiness, credentials, and classroom course access in one place.
          </p>
          
          <div className={styles.timeline}>
            <div className={styles.timelineItem}>
              <div className={styles.timelineBadge}>
                <svg className={styles.timelineBadgeIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div className={styles.timelineContent}>
                <h3 className={styles.timelineStepTitle}>Build your profile</h3>
                <p className={styles.timelineStepDesc}>Set up your operator identity so the workspace can track required steps and readiness clearly.</p>
              </div>
            </div>

            <div className={styles.timelineItem}>
              <div className={styles.timelineBadge}>
                <svg className={styles.timelineBadgeIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
                </svg>
              </div>
              <div className={styles.timelineContent}>
                <h3 className={styles.timelineStepTitle}>Complete onboarding tasks</h3>
                <p className={styles.timelineStepDesc}>Move through required steps, unlock the right checkpoints, and keep progress visible from one dashboard.</p>
              </div>
            </div>

            <div className={styles.timelineItem}>
              <div className={styles.timelineBadge}>
                <svg className={styles.timelineBadgeIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3M15.5 7.5L14 9l-1.5-1.5L14 6z" />
                </svg>
              </div>
              <div className={styles.timelineContent}>
                <h3 className={styles.timelineStepTitle}>Access courses and credentials</h3>
                <p className={styles.timelineStepDesc}>Open classroom courses, submit required credentials, and finish the operator setup flow cleanly.</p>
              </div>
            </div>

            <div className={styles.timelineItem}>
              <div className={styles.timelineBadge}>
                <svg className={styles.timelineBadgeIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div className={styles.timelineContent}>
                <h3 className={styles.timelineStepTitle}>Resume anytime</h3>
                <p className={styles.timelineStepDesc}>Your progress stays saved, so you can come back and continue onboarding or classroom work without losing place.</p>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.authCard} aria-labelledby="operator-login-title">
          <div className={styles.stepperContainer} aria-hidden="true">
            <div className={styles.stepperBar} style={{ width: otpRequested ? '100%' : '50%' }} />
          </div>

          <div className={styles.cardHeader}>
            <svg className={styles.cardHeaderIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <p className={styles.kicker}>Secure Operator Access</p>
          </div>
          <h2 id="operator-login-title" className={styles.title}>
            Enter operator workspace
          </h2>
          <p className={styles.subtitle}>
            {otpRequested ? 'Verify your one-time code to unlock the next required step in your operator workspace.' : 'Sign in with your work email OTP to continue onboarding, operator tasks, and classroom access.'}
          </p>

          {!otpRequested ? (
            <form onSubmit={requestOtp} className={styles.form} noValidate>
              <div className={styles.labelRow}>
                <label className={styles.label} htmlFor="email">
                  Work Email
                </label>
                <span className={styles.hint}>Step 1 of 2</span>
              </div>
              <div className={styles.inputWrapper}>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={styles.input}
                  placeholder="name@company.com"
                  disabled={loading}
                  autoComplete="email"
                />
                <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <button type="submit" className={styles.button} disabled={loading}>
                <span>{loading ? 'Please wait...' : 'Send OTP'}</span>
                {!loading && (
                  <svg className={styles.buttonIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                )}
              </button>
            </form>
          ) : (
            <div className={styles.stepPanel}>
              <p className={styles.stepMeta}>Step 2 of 2 - Verify one-time code</p>
              <div className={styles.identityBlock}>
                <div className={styles.avatar}>
                  {displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div className={styles.identityDetails}>
                  <p className={styles.identityName}>{displayName}</p>
                  <p className={styles.identityEmail}>{email}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpRequested(false);
                      setStatus('');
                    }}
                    className={styles.editButton}
                  >
                    <svg className={styles.editButtonIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="19" y1="12" x2="5" y2="12" />
                      <polyline points="12 19 5 12 12 5" />
                    </svg>
                    <span>Change email</span>
                  </button>
                </div>
              </div>
              <form onSubmit={verifyOtp} className={styles.form}>
                <div className={styles.labelRow}>
                  <label className={styles.label} htmlFor="otp-0">
                    OTP Code
                  </label>
                  <span className={styles.hint}>Valid for 10 minutes</span>
                </div>
                <div className={styles.otpGrid}>
                  {otpDigits.map((digit, index) => (
                    <input
                      key={`otp-${index}`}
                      id={`otp-${index}`}
                      ref={(node) => {
                        otpInputRefs.current[index] = node;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete={index === 0 ? 'one-time-code' : 'off'}
                      className={styles.otpInput}
                      value={digit}
                      onChange={(event) => handleOtpDigitChange(index, event.target.value)}
                      onKeyDown={(event) => handleOtpKeyDown(index, event.key)}
                      onPaste={handleOtpPaste}
                      maxLength={1}
                      aria-label={`OTP digit ${index + 1}`}
                      disabled={loading}
                    />
                  ))}
                </div>
                <div className={styles.resendRow}>
                  <span className={styles.resendHint}>Didn&apos;t receive code?</span>
                  <button
                    type="button"
                    className={styles.resendButton}
                    onClick={resendOtp}
                    disabled={loading || resendCooldown > 0}
                  >
                    {resendLabel}
                  </button>
                </div>
                <button type="submit" className={styles.button} disabled={loading}>
                  <span>{loading ? 'Please wait...' : 'Verify OTP'}</span>
                  {!loading && (
                    <svg className={styles.buttonIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  )}
                </button>
              </form>
            </div>
          )}

          {status ? (
            <div
              className={`${styles.status} ${
                statusTone === 'success' ? styles.statusSuccess : statusTone === 'error' ? styles.statusError : styles.statusInfo
              }`}
              role="status"
              aria-live="polite"
            >
              {statusTone === 'success' && (
                <svg className={styles.statusIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              )}
              {statusTone === 'error' && (
                <svg className={styles.statusIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              )}
              {statusTone === 'info' && (
                <svg className={styles.statusIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              )}
              <span>{status}</span>
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}
