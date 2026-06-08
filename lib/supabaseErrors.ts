type MaybeSupabaseError = {
  code?: string | null;
  message?: string | null;
};

export function isMissingSupabaseTableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const candidate = error as MaybeSupabaseError;
  const message = (candidate.message || '').toLowerCase();
  const code = (candidate.code || '').toLowerCase();

  if (code === 'pgrst205' || code === '42p01') return true;

  return (
    message.includes("could not find the table") ||
    message.includes('schema cache') ||
    message.includes('relation') && message.includes('does not exist')
  );
}
