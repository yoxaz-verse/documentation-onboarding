export const FUNNEL_EVENTS = [
  'landing_view',
  'getting_started_cta_clicked',
  'otp_requested',
  'otp_verified',
  'getting_started_step_1_viewed',
  'getting_started_step_1_completed',
] as const;

export type FunnelEventName = (typeof FUNNEL_EVENTS)[number];

export const FUNNEL_EVENT_LABELS: Record<FunnelEventName, string> = {
  landing_view: 'Landing viewed',
  getting_started_cta_clicked: 'Getting Started selected',
  otp_requested: 'OTP requested',
  otp_verified: 'Signed in',
  getting_started_step_1_viewed: 'Step 1 viewed',
  getting_started_step_1_completed: 'Step 1 completed',
};

export function isFunnelEventName(value: unknown): value is FunnelEventName {
  return typeof value === 'string' && FUNNEL_EVENTS.includes(value as FunnelEventName);
}
