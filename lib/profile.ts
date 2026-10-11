import { expectJson } from './http';
import type { OperatorProfile, OperatorProfileInput } from './types';
import { mutate } from 'swr';
import { PROFILE_KEY } from './clientData';

type ProfilePayload = {
  profile: OperatorProfile;
  completed?: boolean;
};

export async function getProfile(): Promise<OperatorProfile> {
  const response = await fetch('/api/profile');
  const payload = await expectJson<ProfilePayload & { error?: string }>(response, 'Failed to fetch profile.');
  const profile = (payload as ProfilePayload).profile;
  await mutate(PROFILE_KEY, { profile }, { revalidate: false });
  return profile;
}

export async function saveProfile(input: Partial<OperatorProfileInput>): Promise<OperatorProfile> {
  const response = await fetch('/api/profile/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const payload = await expectJson<ProfilePayload & { error?: string }>(response, 'Failed to save profile.');
  return (payload as ProfilePayload).profile;
}

export async function submitProfile(input: OperatorProfileInput): Promise<ProfilePayload> {
  const response = await fetch('/api/profile/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const payload = await expectJson<ProfilePayload & { error?: string }>(response, 'Failed to submit profile.');
  await mutate(PROFILE_KEY, { profile: payload.profile }, { revalidate: false });
  return payload as ProfilePayload;
}
