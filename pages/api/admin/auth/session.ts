import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminSessionFromRequest } from '../../../../lib/adminSession';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const session = getAdminSessionFromRequest(req);
    if (!session) return res.status(401).json({ authenticated: false });

    return res.status(200).json({ authenticated: true, user: session });
  } catch (error) {
    console.error('Admin session API error:', error);
    return res.status(500).json({ authenticated: false, error: 'Session check failed' });
  }
}
