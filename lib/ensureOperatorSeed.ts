import { supabaseAdmin } from './supabaseAdmin';

export async function ensureOperatorSeed(email: string): Promise<string | null> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return 'Operator email is required.';

  const { error } = await supabaseAdmin
    .from('operators')
    .upsert({ email: normalizedEmail }, { onConflict: 'email' });

  if (error) return error.message;
  return null;
}
