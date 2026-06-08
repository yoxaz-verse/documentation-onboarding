import AuthGate from '../components/AuthGate';
import OnboardingStepScreen from '../components/OnboardingStepScreen';

export default function Step7Page() {
  return <AuthGate>{() => <OnboardingStepScreen step={7} />}</AuthGate>;
}
