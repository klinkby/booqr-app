import { LocationService, ServiceService, UserService } from '$lib/api';
import { auth } from '$lib/auth.svelte.js';
import { authedQueryFn } from '$lib/queryClient.js';
import { queryKeys } from '$lib/queryKeys';
import { useResourceMutation, useResourceQuery } from '$lib/resourceQuery.svelte.js';
import { DateUtils } from '$lib/dateUtils.js';
import { createQuery } from '@tanstack/svelte-query';
import { SvelteMap } from 'svelte/reactivity';

/**
 * Route-local data hook for the profile edit page. Composes the user detail
 * query (existing), the save mutation (existing), and extends with bookings
 * queries to expose them as calendar events (joined with service/location/employee names).
 *
 * The user detail query is keyed as `users.detail(auth.userId)` — under the
 * shared `users` prefix. Saving invalidates `users.all`, which refreshes
 * every UserService-derived view (this profile, the contacts list, and the
 * employee roster on services/plan) so a name change propagates everywhere.
 *
 * Bookings are fetched reactively based on a date range (via the getRange thunk),
 * and joined with service/location/employee names for calendar display.
 *
 * @param {() => { from: string|null, to: string|null }} getRange thunk
 *   returning the current date range (ISO date strings for the visible month bounds).
 */
export function useProfileData(getRange) {
	const query = createQuery(() => ({
		queryKey: queryKeys.users.detail(auth.userId),
		enabled: !!auth.userId,
		queryFn: () => authedQueryFn(() => UserService.getUserById(auth.userId)),
	}));

	const saveProfile = useResourceMutation(queryKeys.users.all, (payload) =>
		UserService.updateUser(auth.userId, payload),
	);

	// Bookings query — reactive to range
	const bookings = useResourceQuery(() => {
		const { from, to } = getRange();
		return {
			queryKey: queryKeys.bookings.range(auth.userId, from, to),
			enabled: !!auth.userId && !!from && !!to,
			fetcher: () => UserService.getMyBookings(auth.userId, from, to, 0, 100),
		};
	});

	// Name lookup lists — these are coarse and unfiltered, so they never change
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
		fetcher: () => UserService.getUsers(undefined, 'Employee', 0, 100),
	}));

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
		get bookingsLoading() {
			return bookings.isLoading;
		},
		get bookingsError() {
			return bookings.error;
		},
		get bookingEvents() {
			// Transient id→name lookups (plain Maps — not reactive state, just
			// rebuilt when this derived getter is read). Join each booking's
			// serviceId/employeeId/locationId to a display title.
			const serviceMap = new SvelteMap(services.items.map((s) => [s.id, s.name]));
			const locationMap = new SvelteMap(locations.items.map((l) => [l.id, l.name]));
			const employeeMap = new SvelteMap(employees.items.map((e) => [e.id, e.name]));

			return bookings.items.map((b) => {
				const serviceName = serviceMap.get(b.serviceId) ?? '';
				const employeeName = employeeMap.get(b.employeeId) ?? '';
				const locationName = locationMap.get(b.locationId) ?? '';
				return {
					id: b.id,
					start: DateUtils.utcToLocalIso(b.startTime),
					end: DateUtils.utcToLocalIso(b.endTime),
					title: `${serviceName} · ${employeeName} · ${locationName}`,
				};
			});
		},
		saveProfile: (payload) => saveProfile(payload),
	};
}
