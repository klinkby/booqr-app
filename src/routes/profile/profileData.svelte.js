import { UserService } from '$lib/api';
import { auth } from '$lib/auth.svelte.js';
import { authedQueryFn } from '$lib/queryClient.js';
import { queryKeys } from '$lib/queryKeys';
import { useResourceMutation } from '$lib/resourceQuery.svelte.js';
import { createQuery } from '@tanstack/svelte-query';

/**
 * Route-local data hook for the profile edit page. Caches the current
 * user's profile under queryKeys.profile.detail so navigating away and
 * back is instant. The mutation invalidates the same key, triggering a
 * background refetch after a successful save.
 *
 * Profile is a single object (not a collection), so we use createQuery
 * directly rather than useResourceQuery (which unwraps { items }).
 */
export function useProfileData() {
	const query = createQuery(() => ({
		queryKey: queryKeys.profile.detail(auth.userId),
		enabled: !!auth.userId,
		queryFn: () => authedQueryFn(() => UserService.getUserById(auth.userId)),
	}));

	const saveProfile = useResourceMutation(queryKeys.profile.detail(auth.userId), (payload) =>
		UserService.updateUser(auth.userId, payload),
	);

	return {
		get user() {
			return query.data ?? null;
		},
		get isLoading() {
			return query.isLoading;
		},
		get error() {
			return query.error;
		},
		saveProfile: (payload) => saveProfile(payload),
	};
}
