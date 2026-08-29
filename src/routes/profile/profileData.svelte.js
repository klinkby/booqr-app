import { BookingService, LocationService, ServiceService, UserService } from '$lib/api';
import { auth } from '$lib/auth.svelte.js';
import { authedQueryFn } from '$lib/queryClient.js';
import { queryKeys } from '$lib/queryKeys';
import { useResourceMutation, useResourceQuery } from '$lib/resourceQuery.svelte.js';
import { DateUtils } from '$lib/dateUtils.js';
import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
import { SvelteMap } from 'svelte/reactivity';

// A booking may be rescheduled or cancelled only while it is at least 24h away.
const MANAGE_CUTOFF_MS = 24 * 60 * 60 * 1000;

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
 * Bookings are fetched as the user's full my-bookings set (no query params);
 * they're joined with service/location/employee names for calendar display.
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

	// Cancelling a booking touches two resources: the user's my-bookings set and
	// the vacancy the server re-opens for the freed slot (see the
	// `vacancy-split-on-booking` project memory). `useResourceMutation`
	// invalidates a single key, so this one is written out to invalidate both
	// `bookings.all` and `vacancies.all` coarsely.
	const queryClient = useQueryClient();
	const cancelMutation = createMutation(() => ({
		mutationFn: (id) => authedQueryFn(() => BookingService.deleteBooking(id)),
		onSuccess: () =>
			Promise.all([
				queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all }),
				queryClient.invalidateQueries({ queryKey: queryKeys.vacancies.all }),
			]),
	}));

	// Bookings query — fetch the user's full my-bookings set with no query
	// params; the server decides the result set and the calendar filters/pages
	// client-side.
	const bookings = useResourceQuery(() => ({
		queryKey: queryKeys.bookings.byUser(auth.userId),
		enabled: !!auth.userId,
		fetcher: () => UserService.getMyBookings(auth.userId),
	}));

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
		get bookingEvents() {
			// Transient id→name lookups rebuilt each time this getter is read.
			// Join each booking's serviceId/employeeId/locationId to a title.
			const serviceMap = new SvelteMap(services.items.map((s) => [s.id, s.name]));
			const locationMap = new SvelteMap(locations.items.map((l) => [l.id, l.name]));
			const employeeMap = new SvelteMap(employees.items.map((e) => [e.id, e.name]));

			const now = Date.now();
			return bookings.items.map((b) => {
				const serviceName = serviceMap.get(b.serviceId) ?? '';
				const employeeName = employeeMap.get(b.employeeId) ?? '';
				const locationName = locationMap.get(b.locationId) ?? '';
				return {
					id: b.id,
					start: DateUtils.utcToLocalIso(b.startTime),
					end: DateUtils.utcToLocalIso(b.endTime),
					// Plain title for the library's own use (accessible name, tooltip).
					// The calendar's eventContent renders the styled variant from the
					// separate parts below: "<time> <service>" bold, then "(employee)
					// @ location".
					title: `${serviceName} (${employeeName}) @ ${locationName}`,
					// `manageable` is the domain rule for whether a booking can still be
					// rescheduled or cancelled: only if it starts at least 24h out.
					// Computed here (not in the presentational calendar) from the raw UTC
					// startTime vs. now — both true epochs, so it's timezone-correct.
					extendedProps: {
						serviceName,
						employeeName,
						locationName,
						manageable: Date.parse(b.startTime) - now >= MANAGE_CUTOFF_MS,
					},
				};
			});
		},
		saveProfile: (payload) => saveProfile(payload),
		cancelBooking: (id) => cancelMutation.mutateAsync(id),
	};
}
