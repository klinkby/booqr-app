import {
	BookingService,
	EmployeeService,
	LocationService,
	ServiceService,
	UserService,
	VacancyService,
} from '$lib/api';
import { ApiError } from '$lib/api';
import { auth } from '$lib/auth.svelte.js';
import { authedQueryFn } from '$lib/queryClient.js';
import { queryKeys } from '$lib/queryKeys';
import { useResourceQuery } from '$lib/resourceQuery.svelte.js';
import { createMutation, useQueryClient } from '@tanstack/svelte-query';

/**
 * Route-local data hook for the public booking calendar. Composes the generic
 * resource primitives so +page.svelte stays a thin coordinator.
 *
 * Bookings require auth: the query is enabled only while the user is logged
 * in. Auth state is read inside the thunk so enabling/disabling is reactive.
 *
 * addBooking and deleteBooking both invalidate vacancies AND bookings because
 * a booking changes a vacancy's availability for all visitors.
 *
 * @param {() => { from: string|null, to: string|null }} getRange
 */
export function useHomeData(getRange) {
	const queryClient = useQueryClient();

	const vacancies = useResourceQuery(() => {
		const { from, to } = getRange();
		return {
			queryKey: queryKeys.vacancies.range(from, to),
			enabled: !!from && !!to,
			fetcher: () => VacancyService.getVacancies(from, to, 0, 100),
		};
	});

	const bookings = useResourceQuery(() => {
		const { from, to } = getRange();
		return {
			queryKey: queryKeys.bookings.range(auth.userId, from, to),
			enabled: !!from && !!to && auth.isLoggedIn,
			fetcher: () => UserService.getMyBookings(auth.userId, from, to, 0, 100),
		};
	});

	const locations = useResourceQuery(() => ({
		queryKey: queryKeys.locations.all,
		fetcher: () => LocationService.getLocations(0, 100),
	}));

	const services = useResourceQuery(() => ({
		queryKey: queryKeys.services.all,
		fetcher: () => ServiceService.getServices(0, 100),
	}));

	const employees = useResourceQuery(() => ({
		queryKey: queryKeys.employees.all,
		fetcher: () => EmployeeService.getEmployees(0, 100),
	}));

	async function invalidateAll() {
		await queryClient.invalidateQueries({ queryKey: queryKeys.vacancies.all });
		await queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
	}

	const addBookingMutation = createMutation(() => ({
		mutationFn: (requestBody) => authedQueryFn(() => BookingService.addBooking(requestBody)),
		onSuccess: invalidateAll,
		onError: (error) => {
			// On conflict the vacancy is taken — refetch vacancies so the calendar
			// removes the slot without waiting for a manual navigation.
			if (error instanceof ApiError && error.status === 409) {
				queryClient.invalidateQueries({ queryKey: queryKeys.vacancies.all });
			}
		},
	}));

	const deleteBookingMutation = createMutation(() => ({
		mutationFn: (id) => authedQueryFn(() => BookingService.deleteBooking(id)),
		onSuccess: invalidateAll,
	}));

	return {
		get vacancies() {
			return vacancies.items;
		},
		get bookings() {
			return bookings.items;
		},
		get locations() {
			return locations.items;
		},
		get services() {
			return services.items;
		},
		get employees() {
			return employees.items;
		},
		get isLoading() {
			return vacancies.isLoading;
		},
		get error() {
			return vacancies.error || bookings.error;
		},
		addBooking: (requestBody) => addBookingMutation.mutateAsync(requestBody),
		deleteBooking: (id) => deleteBookingMutation.mutateAsync(id),
	};
}
