import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminCredentials } from '../../../../lib/adminAuth';
import { setAdminSessionCookie } from '../../../../lib/adminSession';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const username = String(req.body?.username || '').trim();
    const password = String(req.body?.password || '');

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const credentials = getAdminCredentials();
    if (username !== credentials.username || password !== credentials.password) {
      return res.status(401).json({ error: 'Invalid admin credentials.' });
    }

    setAdminSessionCookie(res, { username });
    return res.status(200).json({ message: 'Admin login successful.', user: { username } });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ error: 'Admin login unavailable. Check server configuration.' });
  }
}
