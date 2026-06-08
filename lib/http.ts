export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError;
}

export function isUnauthorizedError(error: unknown) {
  return isHttpError(error) && error.status === 401;
}

export async function readJsonResponse<T>(response: Response): Promise<T> {
  return (await response.json().catch(() => ({}))) as T;
}

export async function expectJson<T extends { error?: string }>(response: Response, fallbackMessage: string): Promise<T> {
  const payload = await readJsonResponse<T>(response);
  if (!response.ok) {
    throw new HttpError(response.status, String(payload?.error || fallbackMessage));
  }

  return payload;
}
