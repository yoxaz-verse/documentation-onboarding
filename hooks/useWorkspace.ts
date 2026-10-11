import { useEffect } from 'react';
import { useRouter } from 'next/router';
import useSWR, { mutate, useSWRConfig } from 'swr';
import { isUnauthorizedError } from '../lib/http';
import { apiFetcher, PROFILE_KEY, WORKSPACE_KEY } from '../lib/clientData';
import type { OperatorProfile, WorkspaceBootstrapResponse } from '../lib/types';

export function useWorkspace(options: { redirectOnUnauthorized?: boolean } = {}) {
  const router = useRouter();
  const result = useSWR<WorkspaceBootstrapResponse>(WORKSPACE_KEY, apiFetcher, {
    dedupingInterval: 10_000,
    revalidateOnFocus: false,
    keepPreviousData: true,
  });

  useEffect(() => {
    if (options.redirectOnUnauthorized !== false && isUnauthorizedError(result.error)) router.replace('/');
  }, [options.redirectOnUnauthorized, result.error, router]);

  return {
    ...result,
    user: result.data?.user ?? null,
    progress: result.data?.progress ?? null,
    courseProgress: result.data?.courseProgress ?? null,
    loading: !result.data && !result.error,
  };
}

export function useProfile() {
  return useSWR<{ profile: OperatorProfile }>(PROFILE_KEY, apiFetcher, {
    dedupingInterval: 10_000,
    revalidateOnFocus: false,
    keepPreviousData: true,
  });
}

export async function refreshWorkspace() {
  return mutate(WORKSPACE_KEY);
}

export function useClearOperatorCache() {
  const { cache, mutate: boundMutate } = useSWRConfig();
  return async () => {
    const keys = Array.from(cache.keys()).filter((key) => typeof key === 'string' && key.startsWith('/api/'));
    await Promise.all(keys.map((key) => boundMutate(key, undefined, { revalidate: false })));
  };
}
