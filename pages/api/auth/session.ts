import type { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '../../../lib/session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    if (!process.env.SESSION_SECRET) {
      console.error('session: missing SESSION_SECRET');
      return res.status(500).json({ authenticated: false, error: 'Session check failed' });
    }

    const cookieHeader = req.headers.cookie || '';
    const hasSessionCookie = cookieHeader.includes('obaol_session=');
    const session = getSessionFromRequest(req);
    if (!session) {
      console.debug('session: unauthenticated request', {
        hasCookieHeader: Boolean(cookieHeader),
        hasSessionCookie,
        reason: hasSessionCookie ? 'invalid_or_expired_cookie' : 'missing_cookie',
      });
      return res.status(401).json({ authenticated: false });
    }

    console.debug('session: authenticated request', { email: session.email, hasSessionCookie });
    return res.status(200).json({ authenticated: true, user: session });
  } catch (error) {
    console.error('Session API error:', error);
    return res.status(500).json({ authenticated: false, error: 'Session check failed' });
  }
}
