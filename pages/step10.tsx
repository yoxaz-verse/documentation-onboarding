import AuthGate from '../components/AuthGate';
import OnboardingStepScreen from '../components/OnboardingStepScreen';

export default function Step10Page() {
  return <AuthGate>{() => <OnboardingStepScreen step={10} />}</AuthGate>;
}
