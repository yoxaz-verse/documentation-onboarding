import type { FunnelEventName } from './funnel';

const VISITOR_KEY = 'obaol:funnel-visitor-id';

function getVisitorId() {
  try {
    const existing = window.localStorage.getItem(VISITOR_KEY);
    if (existing) return existing;
    const created = typeof window.crypto?.randomUUID === 'function'
      ? window.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(VISITOR_KEY, created);
    return created;
  } catch {
    return `ephemeral-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

export function trackFunnelEvent(eventName: FunnelEventName, email?: string) {
  if (typeof window === 'undefined') return;
  const body = JSON.stringify({
    eventName,
    visitorId: getVisitorId(),
    email: email?.trim().toLowerCase() || undefined,
    path: window.location.pathname,
  });

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/funnel/events', new Blob([body], { type: 'application/json' }));
      return;
    }
    void fetch('/api/funnel/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      credentials: 'include',
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Analytics must never interrupt the operator journey.
  }
}
