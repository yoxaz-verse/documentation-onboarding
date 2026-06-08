import AuthGate from '../components/AuthGate';
import OnboardingStepScreen from '../components/OnboardingStepScreen';

export default function Step8Page() {
  return <AuthGate>{() => <OnboardingStepScreen step={8} />}</AuthGate>;
}
