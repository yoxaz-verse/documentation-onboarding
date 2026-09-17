import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AuthGate from '../components/AuthGate';
import OnboardingLayout from '../components/OnboardingLayout';
import styles from './onboarding.module.css';
import { isUnauthorizedError } from '../lib/http';
import { areCoursesUnlocked } from '../lib/onboarding';
import { getOrCreateProgress } from '../lib/progress';
import { getProfile } from '../lib/profile';
import type { OperatorProfile, ProgressRecord } from '../lib/types';

function ProfileContent() {
  const router = useRouter();
  const [progress, setProgress] = useState<ProgressRecord | null>(null);
  const [profile, setProfile] = useState<OperatorProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [message, setMessage] = useState('');
  const profileFields = profile
    ? [
        ['Full name', profile.full_name || 'Not set'],
        ['Phone', profile.phone || 'Not set'],
        ['Role', profile.role_title || 'Not set'],
        ['City', profile.city || 'Not set'],
        ['State', profile.state || 'Not set'],
        ['Experience', profile.total_work_experience_years || 'Not set'],
        ['Agro trade', profile.group_trading_experience_years || 'Not set'],
        ['Language', profile.preferred_language || 'Not set'],
        ['Official email', profile.official_company_email || 'Not set'],
        ['Email', profile.email],
      ]
    : [];

  useEffect(() => {
    const load = async () => {
      try {
        const [currentProgress, currentProfile] = await Promise.all([getOrCreateProgress(), getProfile()]);
        setProgress(currentProgress);
        setProfile(currentProfile);
      } catch (error) {
        if (isUnauthorizedError(error)) {
          router.replace('/');
          return;
        }

        setMessage(error instanceof Error ? error.message : 'Failed to load profile.');
      } finally {
        setLoadingProfile(false);
      }
    };
    load();
  }, [router]);

  return (
    <OnboardingLayout
      title="Operator Profile"
      subtitle="Review the details tied to your operator workspace and keep them accurate as you move through onboarding."
      progress={progress}
      loading={loadingProfile}
    >
      {message ? <p className={`${styles.message} ${styles.messageError}`}>{message}</p> : null}

      {profile ? (
        <section className={styles.profileCard}>
          <header className={styles.profileHeader}>
            <h2>Profile overview</h2>
            <p>Account and operator details currently saved for this workspace.</p>
          </header>

          <dl className={styles.profileGrid}>
            {profileFields.map(([label, value]) => (
              <div key={label} className={styles.profileField}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>

          <div className={styles.actionRow}>
            <Link href="/step6" className={styles.cta}>Update Profile Details</Link>
            {!areCoursesUnlocked(progress) ? <Link href="/step1" className={styles.secondaryButton}>Return to onboarding</Link> : null}
          </div>
        </section>
      ) : (
        <p className={styles.message}>Loading profile...</p>
      )}
    </OnboardingLayout>
  );
}

export default function ProfilePage() {
  return <AuthGate>{() => <ProfileContent />}</AuthGate>;
}
