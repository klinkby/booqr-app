import { LocationService, ServiceService, UserService } from '#lib/api/index.js';
import { queryKeys } from '#lib/queryKeys.js';
import { useResourceQuery } from '#lib/resourceQuery.svelte.js';

/**
 * Name lookup lists (services, locations, employees) for joining bookings to
 * display names via `toBookingEvents`. Coarse, unfiltered and cached under each
 * resource's shared key, so every route that needs them shares one fetch.
 *
 * @returns {{ readonly services: Array, readonly locations: Array, readonly employees: Array }}
 */
export function useBookingLookups() {
	const services = useResourceQuery(() => ({
		queryKey: queryKeys.services.all,
		fetcher: () => ServiceService.getServices(0, 100),
	}));

	const locations = useResourceQuery(() => ({
		queryKey: queryKeys.locations.all,
		fetcher: () => LocationService.getLocations(0, 100),
	}));

	const employees = useResourceQuery(() => ({
		queryKey: queryKeys.users.employees,
		fetcher: () => UserService.getUsers(undefined, 'Employee', undefined, 0, 100),
	}));

	return {
		get services() {
			return services.items;
		},
		get locations() {
			return locations.items;
		},
		get employees() {
			return employees.items;
		},
	};
}
