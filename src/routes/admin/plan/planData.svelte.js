import { LocationService, ServiceService, UserService, VacancyService } from '$lib/api';
import { DateUtils } from '$lib/dateUtils.js';
import { m } from '$lib/paraglide/messages.js';
import { queryKeys } from '$lib/queryKeys';
import { useResourceQuery, useResourceMutation, fetchResource } from '$lib/resourceQuery.svelte.js';
import { authedQueryFn } from '$lib/queryClient.js';
import { createQueries } from '@tanstack/svelte-query';
import { SvelteMap } from 'svelte/reactivity';

/**
 * Route-local data hook for the admin plan calendar. Composes the generic
 * resource primitives so `+page.svelte` stays a thin coordinator and the
 * reusable Calendar/VacancyForm components remain purely presentational.
 *
 * This is the template for query-backed routes: keys come from the central
 * `queryKeys` registry, fetching/mutation go through the generic
 * `useResource*` helpers, and only the resource-specific wiring lives here.
 *
 * Must be called once during component setup (it relies on the QueryClient
 * provided higher in the tree).
 *
 * @param {() => { from: string|null, to: string|null }} getRange thunk
 *   returning the current week range read live from the URL.
 * @param {() => string} getEmployeeId thunk returning the currently-selected
 *   employee id for the appointments overlay.
 */
export function usePlanData(getRange, getEmployeeId) {
	const query = useResourceQuery(() => {
		const { from, to } = getRange();
		return {
			queryKey: queryKeys.vacancies.range(from, to),
			enabled: !!from && !!to,
			fetcher: () => VacancyService.getVacancies(from, to, 0, 100),
		};
	});

	const locations = useResourceQuery(() => ({
		queryKey: queryKeys.locations.all,
		fetcher: () => LocationService.getLocations(0, 100),
	}));

	// Use UserService (not EmployeeService) so IDs match vacancy.employeeId and
	// VacancyForm's employee selector which initialises from auth.userId (a User ID).
	const employees = useResourceQuery(() => ({
		queryKey: queryKeys.users.employees,
		fetcher: () => UserService.getUsers(undefined, 'Employee', 0, 100),
	}));

	// The selected employee's appointments (bookings where they are the
	// employee), scoped to the visible week so navigation refetches. Gated on
	// employeeId + range.
	const bookings = useResourceQuery(() => {
		const { from, to } = getRange();
		const employeeId = getEmployeeId();
		return {
			queryKey: queryKeys.bookings.userRange(employeeId, from, to),
			enabled: !!employeeId && !!from && !!to,
			fetcher: () => UserService.getMyBookings(employeeId, from, to, 0, 100),
		};
	});

	// Service names for appointment labels — coarse, unfiltered, never changes.
	const services = useResourceQuery(() => ({
		queryKey: queryKeys.services.all,
		fetcher: () => ServiceService.getServices(0, 100),
	}));

	// Customer names for the appointment labels. On the plan calendar the viewer
	// is the *employee* on each booking, so the customer is a different user whose
	// name must be fetched by id. One detail query per distinct customerId, keyed
	// under `users.detail` so results share the cache other user-detail views fill.
	const customerIds = $derived(
		bookings.items.map((b) => b.customerId).filter((id, i, ids) => id && ids.indexOf(id) === i),
	);
	const customerQueries = createQueries(() => ({
		queries: customerIds.map((id) => ({
			queryKey: queryKeys.users.detail(id),
			queryFn: () => authedQueryFn(() => UserService.getUserById(id)),
		})),
	}));

	const addVacancy = useResourceMutation(queryKeys.vacancies.all, (requestBody) =>
		VacancyService.addVacancy(requestBody),
	);
	const deleteVacancy = useResourceMutation(queryKeys.vacancies.all, (id) => VacancyService.deleteVacancy(id));

	return {
		get vacancies() {
			return query.items;
		},
		get locations() {
			return locations.items;
		},
		get employees() {
			return employees.items;
		},
		get appointmentEvents() {
			// Join each booking's serviceId → name and customerId → name, then map
			// to a blue calendar event. Mirrors profileData's `bookingEvents`.
			const serviceMap = new SvelteMap(services.items.map((s) => [s.id, s.name]));
			// customerIds and customerQueries share an index, so zip them into a map.
			const customerMap = new SvelteMap(customerIds.map((id, i) => [id, customerQueries[i]?.data?.name ?? '']));
			return bookings.items.map((b) => {
				const serviceName = serviceMap.get(b.serviceId) ?? '';
				const customerName = customerMap.get(b.customerId) ?? '';
				return {
					id: `appt-${b.id}`,
					start: DateUtils.utcToLocalIso(b.startTime),
					end: DateUtils.utcToLocalIso(b.endTime),
					title: m.appointmentTitle({ customer: customerName, service: serviceName }),
					startEditable: false,
					durationEditable: false,
					classNames: ['!bg-blue-500', '!text-white', '!border-blue-600'],
					extendedProps: {
						eventType: 'appointment',
						bookingId: b.id,
						customerId: b.customerId,
						serviceId: b.serviceId,
					},
				};
			});
		},
		get isLoading() {
			return query.isLoading;
		},
		get error() {
			return query.error;
		},
		addVacancy,
		deleteVacancy,
		// One-off, always-fresh detail fetch for the view panel.
		getVacancy: (id) => fetchResource(() => VacancyService.getVacancyById(id)),
	};
}
