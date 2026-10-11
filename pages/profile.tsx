import Link from 'next/link';
import AuthGate from '../components/AuthGate';
import OnboardingLayout from '../components/OnboardingLayout';
import LoadingState from '../components/LoadingState';
import styles from './onboarding.module.css';
import { areCoursesUnlocked } from '../lib/onboarding';
import { useProfile, useWorkspace } from '../hooks/useWorkspace';

function ProfileContent() {
  const { progress, loading: loadingWorkspace } = useWorkspace();
  const { data, error, isLoading } = useProfile();
  const profile = data?.profile || null;
  const loadingProfile = loadingWorkspace || isLoading;
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
        ['Email', profile.email],
      ]
    : [];

  return (
    <OnboardingLayout
      title="Operator Profile"
      subtitle="Review the details tied to your operator workspace and keep them accurate as you move through Getting Started."
      progress={progress}
      loading={loadingProfile}
    >
      {error ? <p className={`${styles.message} ${styles.messageError}`}>{error.message || 'Failed to load profile.'}</p> : null}

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
            {!areCoursesUnlocked(progress) ? <Link href="/step1" className={styles.secondaryButton}>Return to Getting Started</Link> : null}
          </div>
        </section>
      ) : (
        loadingProfile ? <LoadingState title="Preparing your profile" message="Loading your account and operator details…" preset="form" /> : null
      )}
    </OnboardingLayout>
  );
}

export default function ProfilePage() {
  // Warm profile data in parallel with the workspace bootstrap.
  useProfile();
  return <AuthGate>{() => <ProfileContent />}</AuthGate>;
}
