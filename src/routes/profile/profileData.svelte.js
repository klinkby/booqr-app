import { UserService } from '$lib/api';
import { auth } from '$lib/auth.svelte.js';
import { authedQueryFn } from '$lib/queryClient.js';
import { queryKeys } from '$lib/queryKeys';
import { useResourceMutation } from '$lib/resourceQuery.svelte.js';
import { createQuery } from '@tanstack/svelte-query';

/**
 * Route-local data hook for the profile edit page. The profile is just the
 * current user's detail, so it's keyed as `users.detail(auth.userId)` — under
 * the shared `users` prefix. Saving invalidates `users.all`, which refreshes
 * every UserService-derived view (this profile, the contacts list, and the
 * employee roster on services/plan) so a name change propagates everywhere.
 *
 * Profile is a single object (not a collection), so we use createQuery
 * directly rather than useResourceQuery (which unwraps { items }).
 */
export function useProfileData() {
	const query = createQuery(() => ({
		queryKey: queryKeys.users.detail(auth.userId),
		enabled: !!auth.userId,
		queryFn: () => authedQueryFn(() => UserService.getUserById(auth.userId)),
	}));

	const saveProfile = useResourceMutation(queryKeys.users.all, (payload) =>
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
