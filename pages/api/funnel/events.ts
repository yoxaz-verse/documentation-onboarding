import type { NextApiRequest, NextApiResponse } from 'next';
import { isFunnelEventName } from '../../../lib/funnel';
import { getSessionFromRequest } from '../../../lib/session';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

const ID_PATTERN = /^[a-zA-Z0-9-]{8,100}$/;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const eventName = req.body?.eventName;
  const visitorId = String(req.body?.visitorId || '').trim();
  const suppliedEmail = String(req.body?.email || '').trim().toLowerCase();
  const path = String(req.body?.path || '').trim().slice(0, 200);
  if (!isFunnelEventName(eventName) || !ID_PATTERN.test(visitorId)) {
    return res.status(400).json({ error: 'Invalid analytics event.' });
  }

  const session = getSessionFromRequest(req);
  const email = session?.email || (eventName === 'otp_requested' ? suppliedEmail : null);
  const { error } = await supabaseAdmin.from('operator_funnel_events').insert({
    event_name: eventName,
    visitor_id: visitorId,
    email: email || null,
    path: path || null,
  });
  if (error) {
    console.error('funnel event insert failed', error.message);
    return res.status(202).json({ accepted: true });
  }
  return res.status(202).json({ accepted: true });
}
