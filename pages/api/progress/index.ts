import type { NextApiRequest, NextApiResponse } from 'next';
import { requireSession } from '../../../lib/serverAuth';
import { getProgressBundleForEmail } from '../../../lib/serverProgress';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireSession(req, res);
  if (!session) return;

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  try {
    return res.status(200).json(await getProgressBundleForEmail(session.email));
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch progress.' });
  }
}
