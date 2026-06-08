import AuthGate from '../components/AuthGate';
import OnboardingStepScreen from '../components/OnboardingStepScreen';

export default function Step3Page() {
  return <AuthGate>{() => <OnboardingStepScreen step={3} />}</AuthGate>;
}
