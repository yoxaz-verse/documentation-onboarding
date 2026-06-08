import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminSessionFromRequest } from './adminSession';

export function getAdminCredentials() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    throw new Error('Missing ADMIN_USERNAME or ADMIN_PASSWORD.');
  }

  return { username, password };
}

export function requireAdminSession(req: NextApiRequest, res: NextApiResponse) {
  const session = getAdminSessionFromRequest(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  return session;
}
