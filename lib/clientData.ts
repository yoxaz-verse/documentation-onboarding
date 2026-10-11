import { HttpError, readJsonResponse } from './http';

export const WORKSPACE_KEY = '/api/workspace';
export const PROFILE_KEY = '/api/profile';

export async function apiFetcher<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: 'include', cache: 'no-store' });
  const payload = await readJsonResponse<T & { error?: string }>(response);
  if (!response.ok) throw new HttpError(response.status, String(payload?.error || 'Request failed.'));
  return payload as T;
}
