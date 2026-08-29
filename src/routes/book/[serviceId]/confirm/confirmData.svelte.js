import {
	ApiError,
	AuthenticationService,
	BookingService,
	EmployeeService,
	LocationService,
	ServiceService,
	UserService,
	VacancyService,
} from '$lib/api';
import { authedQueryFn } from '$lib/queryClient.js';
import { queryKeys } from '$lib/queryKeys';
import { fetchResource, usePublicMutation, useResourceQuery } from '$lib/resourceQuery.svelte.js';
import { createMutation, useQueryClient } from '@tanstack/svelte-query';

/**
 * Route-local data hook for the confirmation page (steps 6-7): the inline
 * auth gate (login / sign-up) and the confirm-appointment submit.
 *
 * Login and sign-up are pre-auth flows — `usePublicMutation` deliberately
 * skips `authedQueryFn` (a 401 here is a real failure, not a refresh
 * trigger) and touches no cache.
 *
 * `addBooking` is written directly with `createMutation` rather than
 * `useResourceMutation` so a 409 (slot taken) can invalidate `vacancies.all`
 * too — mirroring the reused pattern in `homeData.svelte.js`, otherwise the
 * booking wizard's cached availability (staleTime: Infinity) would keep
 * showing the just-taken slot after the user is routed to the conflict page.
 */
export function useConfirmData() {
	const queryClient = useQueryClient();

	const services = useResourceQuery(() => ({
		queryKey: queryKeys.services.all,
		fetcher: () => ServiceService.getServices(0, 100),
	}));

	const employees = useResourceQuery(() => ({
		queryKey: queryKeys.employees.all,
		fetcher: () => EmployeeService.getEmployees(),
	}));

	const locations = useResourceQuery(() => ({
		queryKey: queryKeys.locations.all,
		fetcher: () => LocationService.getLocations(0, 100),
	}));

	const login = usePublicMutation((credentials) => AuthenticationService.login(credentials));
	const signUp = usePublicMutation((email) => UserService.addUser({ email }));

	const addBookingMutation = createMutation(() => ({
		mutationFn: (requestBody) => authedQueryFn(() => BookingService.addBooking(requestBody)),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.vacancies.all });
			queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
		},
		onError: (error) => {
			if (error instanceof ApiError && error.status === 409) {
				queryClient.invalidateQueries({ queryKey: queryKeys.vacancies.all });
			}
		},
	}));

	const deleteBookingMutation = createMutation(() => ({
		mutationFn: (id) => authedQueryFn(() => BookingService.deleteBooking(id)),
		onSuccess: () =>
			Promise.all([
				queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all }),
				queryClient.invalidateQueries({ queryKey: queryKeys.vacancies.all }),
			]),
	}));

	return {
		get services() {
			return services.items;
		},
		get employees() {
			return employees.items;
		},
		get locations() {
			return locations.items;
		},
		// Always-fresh detail fetch — the vacancy may have been taken by
		// someone else between step 5 and landing here.
		getVacancy: (id) => fetchResource(() => VacancyService.getVacancyById(id)),
		login: (credentials) => login(credentials),
		signUp: (email) => signUp({ email }),
		addBooking: (requestBody) => addBookingMutation.mutateAsync(requestBody),
		deleteBooking: (id) => deleteBookingMutation.mutateAsync(id),
	};
}
