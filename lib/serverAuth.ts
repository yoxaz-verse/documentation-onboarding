import type { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from './session';
import type { SessionUser } from './types';
import { supabaseAdmin } from './supabaseAdmin';

export async function requireSession(req: NextApiRequest, res: NextApiResponse): Promise<SessionUser | null> {
  const session = getSessionFromRequest(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  const { data: operator, error } = await supabaseAdmin
    .from('operators')
    .select('invitation_status')
    .eq('email', session.email)
    .maybeSingle();
  if (error || !operator || operator.invitation_status === 'disabled') {
    res.status(error ? 500 : 401).json({ error: error ? 'Unable to verify operator access.' : 'Operator access is disabled.' });
    return null;
  }
  return session;
}
