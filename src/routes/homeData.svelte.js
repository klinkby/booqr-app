import { LocationService, ServiceService } from '$lib/api';
import { queryKeys } from '$lib/queryKeys';
import { useResourceQuery } from '$lib/resourceQuery.svelte.js';

/**
 * Route-local data hook for the home page (step 1 of the customer booking
 * wizard — "Select a service"). Every service is shown regardless of
 * availability; the wizard itself filters by availability once a service is
 * chosen.
 *
 * Locations are fetched here too, under the same `queryKeys.locations.all`
 * key the booking wizard's `useBookingData` hook uses — this warms the cache
 * (`staleTime: Infinity`) so step 2 ("Where?") never shows a loading flicker
 * for data that was already available while the user was picking a service.
 * Nothing on this page reads the location list directly.
 */
export function useHomeData() {
	const services = useResourceQuery(() => ({
		queryKey: queryKeys.services.all,
		fetcher: () => ServiceService.getServices(0, 100),
	}));

	const locations = useResourceQuery(() => ({
		queryKey: queryKeys.locations.all,
		fetcher: () => LocationService.getLocations(0, 100),
	}));

	return {
		get services() {
			return services.items;
		},
		get isLoading() {
			return services.isLoading || locations.isLoading;
		},
		get error() {
			return services.error || locations.error;
		},
	};
}
