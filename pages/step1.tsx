import AuthGate from '../components/AuthGate';
import OnboardingStepScreen from '../components/OnboardingStepScreen';

export default function Step1Page() {
  return <AuthGate>{() => <OnboardingStepScreen step={1} />}</AuthGate>;
}
