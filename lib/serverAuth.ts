import type { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from './session';
import type { SessionUser } from './types';

export function requireSession(req: NextApiRequest, res: NextApiResponse): SessionUser | null {
  const session = getSessionFromRequest(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  return session;
}
