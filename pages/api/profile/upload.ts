import crypto from 'crypto';
import type { NextApiRequest, NextApiResponse } from 'next';
import { requireSession } from '../../../lib/serverAuth';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

const BUCKET = 'operator-profile-photos';
const MAX_BYTES = 3 * 1024 * 1024;

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb',
    },
  },
};

function parseDataUrl(dataUrl: string): { mime: string; buffer: Buffer } | null {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;
  const mime = match[1];
  const buffer = Buffer.from(match[2], 'base64');
  return { mime, buffer };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = requireSession(req, res);
  if (!session) return;

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const dataUrl = req.body?.dataUrl;
  if (typeof dataUrl !== 'string' || dataUrl.length === 0) {
    return res.status(400).json({ error: 'Image data is required.' });
  }

  const parsed = parseDataUrl(dataUrl);
  if (!parsed) return res.status(400).json({ error: 'Invalid image format.' });
  if (parsed.buffer.length > MAX_BYTES) return res.status(400).json({ error: 'Image too large. Max 3MB.' });

  const ext = parsed.mime.split('/')[1] || 'png';
  const safeEmail = session.email.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filePath = `${safeEmail}/${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(filePath, parsed.buffer, { contentType: parsed.mime, upsert: false });

  if (uploadError) return res.status(500).json({ error: uploadError.message });

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filePath);
  return res.status(200).json({ url: data.publicUrl });
}
