import AuthGate from '../components/AuthGate';
import OnboardingStepScreen from '../components/OnboardingStepScreen';

export default function Step2Page() {
  return <AuthGate>{() => <OnboardingStepScreen step={2} />}</AuthGate>;
}
