import AuthGate from '../components/AuthGate';
import OnboardingStepScreen from '../components/OnboardingStepScreen';

export default function Step9Page() {
  return <AuthGate>{() => <OnboardingStepScreen step={9} />}</AuthGate>;
}
