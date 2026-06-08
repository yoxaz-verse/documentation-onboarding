import AuthGate from '../components/AuthGate';
import OnboardingStepScreen from '../components/OnboardingStepScreen';

export default function Step4Page() {
  return <AuthGate>{() => <OnboardingStepScreen step={4} />}</AuthGate>;
}
