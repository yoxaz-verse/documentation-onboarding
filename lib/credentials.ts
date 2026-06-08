import { expectJson } from './http';
import type { OperatorCredentialView } from './types';

type CredentialsPayload = {
  credentials: OperatorCredentialView;
};

export async function getCredentials(): Promise<OperatorCredentialView> {
  const response = await fetch('/api/credentials');
  const payload = await expectJson<CredentialsPayload & { error?: string }>(response, 'Failed to fetch credentials.');
  return (payload as CredentialsPayload).credentials;
}

export async function submitCredentials(input: {
  mailboxEmail: string;
  appPassword: string;
  notes?: string;
}): Promise<OperatorCredentialView> {
  const response = await fetch('/api/credentials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const payload = await expectJson<CredentialsPayload & { error?: string }>(response, 'Failed to save credentials.');
  return (payload as CredentialsPayload).credentials;
}
