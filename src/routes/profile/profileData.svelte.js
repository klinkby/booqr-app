import { BookingService, DataTakeoutService, UserService } from '#lib/api/index.js';
import { auth } from '#lib/auth.svelte.js';
import { useBookingLookups } from '#lib/bookingLookups.svelte.js';
import { authedQueryFn } from '#lib/queryClient.js';
import { queryKeys } from '#lib/queryKeys.js';
import { fetchResource, useResourceMutation, useResourceQuery } from '#lib/resourceQuery.svelte.js';
import { toBookingEvents } from '#lib/bookingEvents.js';
import { createQuery, useQueryClient } from '@tanstack/svelte-query';

// A customer may reschedule or cancel a booking only while it is at least 24h
// away. Employees and admins are exempt.
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
	// `vacancy-split-on-booking` project memory), so both are invalidated.
	const cancelBooking = useResourceMutation([queryKeys.bookings.all, queryKeys.vacancies.all], (id) =>
		BookingService.deleteBooking(id),
	);

	// Restoring a backup invalidates the whole cache (see importTakeout below).
	const queryClient = useQueryClient();

	// Bookings query — fetch the user's full my-bookings set with no query
	// params; the server decides the result set and the calendar filters/pages
	// client-side.
	const bookings = useResourceQuery(() => ({
		queryKey: queryKeys.bookings.byUser(auth.userId),
		enabled: !!auth.userId,
		fetcher: () => UserService.getMyBookings(auth.userId),
	}));

	const lookups = useBookingLookups();

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
			const now = Date.now();
			return toBookingEvents(
				bookings.items,
				lookups,
				(b) => auth.isEmployee || Date.parse(b.startTime) - now >= MANAGE_CUTOFF_MS,
			);
		},
		saveProfile: (payload) => saveProfile(payload),
		cancelBooking,
		// GDPR data portability: the user's own takeout document. Always fetched
		// fresh and never cached — it holds PII and must reflect the current state.
		exportMyTakeout: () => fetchResource(() => DataTakeoutService.exportMyTakeout()),
		// Organization backup (admin only): same fresh, uncached read as above.
		exportTenantTakeout: () => fetchResource(() => DataTakeoutService.exportTenantTakeout()),
		// Restore a backup. A dry run only reports what would change. A real
		// import can touch every resource, so it invalidates the whole cache
		// rather than one key and resolves only after the refetch has settled.
		importTakeout: async (doc, dryRun) => {
			const result = await fetchResource(() => DataTakeoutService.importTakeout(doc, dryRun));
			if (!dryRun) await queryClient.invalidateQueries();
			return result;
		},
	};
}
