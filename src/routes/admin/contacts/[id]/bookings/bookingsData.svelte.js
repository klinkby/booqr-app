import { BookingService, UserService } from '#lib/api/index.js';
import { toBookingEvents } from '#lib/bookingEvents.js';
import { useBookingLookups } from '#lib/bookingLookups.svelte.js';
import { DateUtils } from '#lib/dateUtils.js';
import { authedQueryFn } from '#lib/queryClient.js';
import { queryKeys } from '#lib/queryKeys.js';
import { fetchAllPages, useResourceMutation, useResourceQuery } from '#lib/resourceQuery.svelte.js';
import { page } from '$app/state';
import { createQuery } from '@tanstack/svelte-query';

/**
 * Route-local data hook for a staff member's view of one contact's upcoming
 * bookings (`/admin/contacts/[id]/bookings`). The contact id comes from the
 * route params and is read inside each query thunk so navigation refetches.
 *
 * The bookings query walks every page of the contact's my-bookings set from
 * now onwards. Staff are exempt from the customer 24h cutoff, so every booking
 * is manageable. Cancelling invalidates the bookings and vacancies it touches.
 */
export function useContactBookingsData() {
	const contact = createQuery(() => {
		const id = page.params.id;
		return {
			queryKey: queryKeys.users.detail(id),
			queryFn: () => authedQueryFn(() => UserService.getUserById(id)),
		};
	});

	// Upcoming only: FromTime is "now", evaluated when the fetch runs.
	const bookings = useResourceQuery(() => {
		const id = page.params.id;
		return {
			queryKey: queryKeys.bookings.upcomingByUser(id),
			fetcher: () =>
				fetchAllPages((start, num) => UserService.getMyBookings(id, DateUtils.nowUtcIso(), undefined, start, num)),
		};
	});

	const lookups = useBookingLookups();

	// Memoized: rebuilt only when the bookings or a lookup list changes, so the
	// calendar isn't handed a fresh array on every read. Staff are exempt from
	// the customer 24h cutoff, so every booking is manageable.
	const bookingEvents = $derived.by(() => toBookingEvents(bookings.items, lookups, () => true));

	// Cancelling a booking touches the contact's upcoming set and the vacancy the
	// server re-opens for the freed slot (see the `vacancy-split-on-booking`
	// project memory), so both are invalidated.
	const cancelBooking = useResourceMutation([queryKeys.bookings.all, queryKeys.vacancies.all], (bookingId) =>
		BookingService.deleteBooking(bookingId),
	);

	return {
		get contactName() {
			return contact.data?.name || contact.data?.email || '';
		},
		get isLoading() {
			return contact.isLoading || bookings.isLoading;
		},
		get error() {
			return contact.error || bookings.error || null;
		},
		get bookingEvents() {
			return bookingEvents;
		},
		cancelBooking,
	};
}
