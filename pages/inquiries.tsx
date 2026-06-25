import { useEffect, useState } from 'react';
import AuthGate from '../components/AuthGate';
import OnboardingLayout from '../components/OnboardingLayout';
import { isUnauthorizedError } from '../lib/http';
import { getProgressBundle } from '../lib/progress';
import type { CourseProgressSummary, ProgressRecord, PublicLiveInquiry, SessionUser } from '../lib/types';
import styles from './onboarding.module.css';

type PageState =
  | { status: 'loading' }
  | { status: 'ready'; progress: ProgressRecord; courseProgress: CourseProgressSummary; inquiries: PublicLiveInquiry[] }
  | { status: 'error'; message: string };

function formatDate(value: string | null) {
  if (!value) return 'Recently posted';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently posted';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function InquiriesContent({ user }: { user: SessionUser }) {
  const [state, setState] = useState<PageState>({ status: 'loading' });

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [progressBundle, inquiriesResponse] = await Promise.all([
          getProgressBundle(),
          fetch('/api/inquiries', { credentials: 'include', cache: 'no-store' }),
        ]);
        const inquiriesPayload = await inquiriesResponse.json().catch(() => ({}));
        if (!active) return;

        if (!inquiriesResponse.ok) {
          if (inquiriesResponse.status === 401) {
            window.location.assign('/');
            return;
          }
          throw new Error(inquiriesPayload?.error || 'Failed to load live inquiries.');
        }

        setState({
          status: 'ready',
          progress: progressBundle.progress,
          courseProgress: progressBundle.courseProgress,
          inquiries: (inquiriesPayload.inquiries || []) as PublicLiveInquiry[],
        });
      } catch (error) {
        if (!active) return;
        if (isUnauthorizedError(error)) {
          window.location.assign('/');
          return;
        }
        setState({ status: 'error', message: error instanceof Error ? error.message : 'Failed to load live inquiries.' });
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  const progress = state.status === 'ready' ? state.progress : null;
  const courseProgress = state.status === 'ready' ? state.courseProgress : null;
  const inquiries = state.status === 'ready' ? state.inquiries : [];
  const loading = state.status === 'loading';

  return (
    <OnboardingLayout
      title="Live inquiries"
      subtitle="Review current generic order requests and product quantities posted by the admin team."
      progress={progress}
      courseProgress={courseProgress}
      loading={loading}
    >
      {state.status === 'loading' ? <p className={styles.message}>Loading live inquiries...</p> : null}
      {state.status === 'error' ? <p className={`${styles.message} ${styles.messageError}`}>{state.message}</p> : null}

      {state.status === 'ready' ? (
        <>
          <section className={`${styles.callout} ${styles.inquiriesHero}`}>
            <div className={styles.homeHeroHeader}>
              <div>
                <p className={styles.homeHeroEyebrow}>Current board</p>
                <h2 className={styles.homeHeroTitle}>{inquiries.length ? `${inquiries.length} live ${inquiries.length === 1 ? 'inquiry' : 'inquiries'}` : 'No live inquiries yet'}</h2>
              </div>
              <span className={styles.homeStatusPill}>View only</span>
            </div>
            <p className={styles.calloutText}>
              Signed in as <strong>{user.email}</strong>. These inquiries are generic order summaries for operator practice and execution awareness.
            </p>
          </section>

          {inquiries.length ? (
            <section className={styles.inquiryGrid} aria-label="Published live inquiries">
              {inquiries.map((inquiry) => (
                <article key={inquiry.id} className={styles.inquiryCard}>
                  <div className={styles.inquiryCardHeader}>
                    <div>
                      <p className={styles.homeHeroEyebrow}>Posted {formatDate(inquiry.createdAt)}</p>
                      <h3 className={styles.inquiryTitle}>{inquiry.title}</h3>
                    </div>
                    <span className={styles.homeStatusPill}>{inquiry.products.length} product{inquiry.products.length === 1 ? '' : 's'}</span>
                  </div>
                  {inquiry.orderSummary ? <p className={styles.inquirySummary}>{inquiry.orderSummary}</p> : null}
                  <div className={styles.inquiryTableWrap}>
                    <table className={styles.inquiryTable}>
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Quantity</th>
                          <th>Unit</th>
                          <th>Specification / notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inquiry.products.map((product, index) => (
                          <tr key={`${product.product}-${index}`}>
                            <td>{product.product}</td>
                            <td>{product.quantity}</td>
                            <td>{product.unit || 'N/A'}</td>
                            <td>{product.specification || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>
              ))}
            </section>
          ) : (
            <section className={styles.emptyInquiryState}>
              <h2>No live inquiries are currently posted.</h2>
              <p>When the admin team displays an inquiry, it will appear here with the order summary and product quantities.</p>
            </section>
          )}
        </>
      ) : null}
    </OnboardingLayout>
  );
}

export default function InquiriesPage() {
  return <AuthGate>{(user) => <InquiriesContent user={user} />}</AuthGate>;
}
