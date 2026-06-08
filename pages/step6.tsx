import AuthGate from '../components/AuthGate';
import OnboardingStepScreen from '../components/OnboardingStepScreen';

export default function Step6Page() {
  return <AuthGate>{() => <OnboardingStepScreen step={6} />}</AuthGate>;
}
