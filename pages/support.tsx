import { useEffect, useState } from 'react';
import AuthGate from '../components/AuthGate';
import OnboardingLayout from '../components/OnboardingLayout';
import SupportContactList from '../components/SupportContactList';
import { getProgressBundle } from '../lib/progress';
import type { CourseProgressSummary, ProgressRecord } from '../lib/types';

function SupportContent() {
  const [progress, setProgress] = useState<ProgressRecord | null>(null);
  const [courseProgress, setCourseProgress] = useState<CourseProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProgressBundle()
      .then((bundle) => {
        setProgress(bundle.progress);
        setCourseProgress(bundle.courseProgress);
      })
      .catch(() => {
        // The contact list has its own error state; keep this page usable if progress is temporarily unavailable.
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <OnboardingLayout
      title="Operator Support"
      subtitle="Contact an available onboarding or operator support person when you need guidance."
      progress={progress}
      courseProgress={courseProgress}
      loading={loading}
    >
      <SupportContactList />
    </OnboardingLayout>
  );
}

export default function SupportPage() {
  return <AuthGate>{() => <SupportContent />}</AuthGate>;
}
