import { HttpError, expectJson, readJsonResponse } from './http';
import type { ProgressRecord, ProgressResponse } from './types';
import type { StepKey } from './onboarding';

export async function getProgressBundle(): Promise<ProgressResponse> {
  const response = await fetch('/api/progress');
  const payload = await readJsonResponse<ProgressResponse & { error?: string }>(response);
  if (!response.ok) {
    const errorMessage = String(payload?.error || '');
    if (errorMessage.includes("Could not find the table 'public.course_submodule_state'")) {
      throw new Error('Database schema is not up to date. Run pending Supabase migrations and retry.');
    }

    throw new HttpError(response.status, errorMessage || 'Failed to fetch progress.');
  }

  return payload as ProgressResponse;
}

export async function getOrCreateProgress(): Promise<ProgressRecord> {
  const bundle = await getProgressBundle();
  return bundle.progress;
}

export async function completeStep(step: StepKey) {
  const response = await fetch('/api/progress/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ step }),
  });

  const payload = await expectJson<{ progress: ProgressRecord; error?: string }>(response, 'Failed to update progress.');

  return payload.progress as ProgressRecord;
}
