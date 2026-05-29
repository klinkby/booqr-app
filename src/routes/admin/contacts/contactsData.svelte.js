import { UserService } from '$lib/api';
import { queryKeys } from '$lib/queryKeys';
import { usePagedResourceQuery } from '$lib/resourceQuery.svelte.js';

/**
 * Route-local data hook for the contacts list page.
 */
export function useContactsData() {
	return usePagedResourceQuery(() => ({
		queryKey: queryKeys.users.paged,
		fetcher: (start, num) => UserService.getUsers(null, null, num, start),
	}));
}
