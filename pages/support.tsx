import AuthGate from '../components/AuthGate';
import OnboardingLayout from '../components/OnboardingLayout';
import SupportContactList, { useSupportContacts } from '../components/SupportContactList';
import { useWorkspace } from '../hooks/useWorkspace';

function SupportContent() {
  const { progress, courseProgress, loading } = useWorkspace();

  return (
    <OnboardingLayout
      title="Operator Support"
      subtitle="Contact an available Getting Started or operator support person when you need guidance."
      progress={progress}
      courseProgress={courseProgress}
      loading={loading}
    >
      <SupportContactList />
    </OnboardingLayout>
  );
}

export default function SupportPage() {
  // Start optional contact data alongside the workspace bootstrap. SWR shares
  // this in-flight request with SupportContactList once authentication resolves.
  useSupportContacts();
  return <AuthGate>{() => <SupportContent />}</AuthGate>;
}
