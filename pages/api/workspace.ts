import type { NextApiRequest, NextApiResponse } from 'next';
import { requireSession } from '../../lib/serverAuth';
import { getProgressBundleForEmail } from '../../lib/serverProgress';
import type { WorkspaceBootstrapResponse } from '../../lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireSession(req, res);
  if (!session) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  try {
    const bundle = await getProgressBundleForEmail(session.email);
    const payload: WorkspaceBootstrapResponse = { user: session, ...bundle };
    return res.status(200).json(payload);
  } catch (error) {
    console.error('Workspace bootstrap error:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to load workspace.' });
  }
}
