import AuthGate from '../components/AuthGate';
import OnboardingStepScreen from '../components/OnboardingStepScreen';

export default function Step11Page() {
  return <AuthGate>{() => <OnboardingStepScreen step={11} />}</AuthGate>;
}
