import AuthGate from '../components/AuthGate';
import OnboardingStepScreen from '../components/OnboardingStepScreen';

export default function Step5Page() {
  return <AuthGate>{() => <OnboardingStepScreen step={5} />}</AuthGate>;
}
