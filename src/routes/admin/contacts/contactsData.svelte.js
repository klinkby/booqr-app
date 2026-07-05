import { UserService } from '$lib/api';
import { queryKeys } from '$lib/queryKeys';
import { usePagedResourceQuery } from '$lib/resourceQuery.svelte.js';

/**
 * Route-local data hook for the contacts list page.
 *
 * @param {() => { name?: string, roles?: string[] }} [getFilters] thunk
 *   returning the current filter state read live from the route; name maps
 *   to the `k` query param, roles map to (possibly repeated) `role`.
 */
export function useContactsData(getFilters = () => ({})) {
	return usePagedResourceQuery(() => {
		const { name, roles } = getFilters();
		const k = name || undefined;
		const role = roles && roles.length ? roles : undefined;
		return {
			queryKey: queryKeys.users.paged(k, role),
			fetcher: (start, num) => UserService.getUsers(k, role, num, start),
		};
	});
}
