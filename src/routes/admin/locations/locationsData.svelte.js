import { LocationService } from '$lib/api';
import { queryKeys } from '$lib/queryKeys';
import { usePagedResourceQuery } from '$lib/resourceQuery.svelte.js';

/**
 * Route-local data hook for the locations list page. Wraps usePagedResourceQuery
 * so pagination state and caching are managed by the QueryClient.
 */
export function useLocationsData() {
	return usePagedResourceQuery(() => ({
		queryKey: queryKeys.locations.paged,
		fetcher: (start, num) => LocationService.getLocations(start, num),
	}));
}
