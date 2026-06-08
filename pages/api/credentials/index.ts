import type { NextApiRequest, NextApiResponse } from 'next';
import { encryptCredentialSecret } from '../../../lib/credentialsCrypto';
import { ensureOperatorSeed } from '../../../lib/ensureOperatorSeed';
import { requireSession } from '../../../lib/serverAuth';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import type { OperatorCredentialRecord, OperatorCredentialView } from '../../../lib/types';

function toView(record: OperatorCredentialRecord | null): OperatorCredentialView {
  if (!record) {
    return {
      mailboxEmail: '',
      notes: '',
      appPasswordSaved: false,
      updatedAt: null,
    };
  }

  return {
    mailboxEmail: record.mailbox_email || '',
    notes: record.notes || '',
    appPasswordSaved: Boolean(record.app_password_encrypted),
    updatedAt: record.updated_at || null,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = requireSession(req, res);
  if (!session) return;

  const seedError = await ensureOperatorSeed(session.email);
  if (seedError) return res.status(500).json({ error: `Failed to ensure operator record: ${seedError}` });

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('operator_credentials')
      .select('*')
      .eq('email', session.email)
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ credentials: toView(data as OperatorCredentialRecord | null) });
  }

  if (req.method === 'POST') {
    const mailboxEmail = String(req.body?.mailboxEmail || '').trim().toLowerCase();
    const appPassword = String(req.body?.appPassword || '').trim();
    const notes = String(req.body?.notes || '').trim();

    if (!mailboxEmail || !mailboxEmail.includes('@')) {
      return res.status(400).json({ error: 'Valid mailbox email is required.' });
    }
    if (!appPassword) {
      return res.status(400).json({ error: 'App password is required.' });
    }

    let encryptedSecret = '';
    try {
      encryptedSecret = encryptCredentialSecret(appPassword);
    } catch (error) {
      return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to encrypt app password.' });
    }

    const { data, error } = await supabaseAdmin
      .from('operator_credentials')
      .upsert(
        {
          email: session.email,
          mailbox_email: mailboxEmail,
          app_password_encrypted: encryptedSecret,
          notes,
        },
        { onConflict: 'email' }
      )
      .select('*')
      .single();

    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ credentials: toView(data as OperatorCredentialRecord) });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
