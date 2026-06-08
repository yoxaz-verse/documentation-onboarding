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
  const [message, setMessage] = useState('');

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
      }
    };
    load();
  }, [router]);

  return (
    <OnboardingLayout
      title="Operator Profile"
      subtitle="Review the details tied to your operator workspace and keep them accurate as you move through onboarding."
      progress={progress}
    >
      <div className={styles.brandBanner}>
        <div className={styles.brandLogo}>OBAOL</div>
        <p className={styles.brandCaption}>Operator Profile Overview</p>
      </div>

      {message ? <p className={`${styles.message} ${styles.messageError}`}>{message}</p> : null}

      {profile ? (
        <section className={styles.profileCard}>
          <div className={styles.profileGrid}>
            <div><strong>Full Name:</strong> {profile.full_name || 'Not set'}</div>
            <div><strong>Phone:</strong> {profile.phone || 'Not set'}</div>
            <div><strong>Role:</strong> {profile.role_title || 'Not set'}</div>
            <div><strong>City:</strong> {profile.city || 'Not set'}</div>
            <div><strong>State:</strong> {profile.state || 'Not set'}</div>
            <div><strong>Experience:</strong> {profile.total_work_experience_years || 'Not set'}</div>
            <div><strong>Agro Trade:</strong> {profile.group_trading_experience_years || 'Not set'}</div>
            <div><strong>Language:</strong> {profile.preferred_language || 'Not set'}</div>
            <div><strong>Official Email:</strong> {profile.official_company_email || 'Not set'}</div>
            <div><strong>Email:</strong> {profile.email}</div>
          </div>

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
