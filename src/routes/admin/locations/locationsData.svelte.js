import { LocationService } from '#lib/api/index.js';
import { queryKeys } from '#lib/queryKeys.js';
import { usePagedResourceQuery, useResourceMutation } from '#lib/resourceQuery.svelte.js';

/**
 * Route-local data hook for the locations list page. Wraps usePagedResourceQuery
 * so pagination state and caching are managed by the QueryClient.
 */
export function useLocationsData() {
	const query = usePagedResourceQuery(() => ({
		queryKey: queryKeys.locations.paged,
		fetcher: (start, num) => LocationService.getLocations(start, num),
	}));
	const deleteLocation = useResourceMutation(queryKeys.locations.all, (id) => LocationService.deleteLocation(id));
	return Object.assign(query, { deleteLocation });
}
