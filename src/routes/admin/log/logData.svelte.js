import { ActivityService } from '#lib/api/index.js';
import { queryKeys } from '#lib/queryKeys.js';
import { usePagedResourceQuery } from '#lib/resourceQuery.svelte.js';

/**
 * Route-local data hook for the activity log page.
 *
 * @param {() => string} getFromTime thunk returning the FromTime ISO string,
 *   read live from the route's URL so a date change refetches.
 */
export function useLogData(getFromTime) {
	return usePagedResourceQuery(() => {
		const fromTime = getFromTime();
		return {
			queryKey: queryKeys.activities.paged(fromTime),
			fetcher: (start, num) => ActivityService.getActivities(fromTime, undefined, start, num),
		};
	});
}
