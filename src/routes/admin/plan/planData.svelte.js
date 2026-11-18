import { BookingService, LocationService, ServiceService, UserService, VacancyService } from '#lib/api/index.js';
import { DateUtils } from '#lib/dateUtils.js';
import { m } from '#lib/paraglide/messages.js';
import { eventAppointment } from '#lib/ui.js';
import { queryKeys } from '#lib/queryKeys.js';
import { useResourceQuery, useResourceMutation, fetchResource } from '#lib/resourceQuery.svelte.js';
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
		fetcher: () => UserService.getUsers(undefined, 'Employee', undefined, 0, 100),
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
	// name must be fetched by id. Names accumulate in `customerNames` for the life
	// of the page, so only customers not seen in an earlier week are fetched — in
	// one batched /api/users?Id=…&Id=… request (bookings are capped at Num=100,
	// matching the API's 100-id cap). Known customers keep their label while a
	// week loads instead of flashing blank. Sorted so the same set always hits the
	// same cache entry.
	const customerNames = new SvelteMap();
	const missingCustomerIds = $derived(
		bookings.items
			.map((b) => b.customerId)
			.filter((id, i, ids) => id && ids.indexOf(id) === i && !customerNames.has(id))
			.sort((a, b) => a - b),
	);
	const customers = useResourceQuery(() => ({
		queryKey: queryKeys.users.byIds(missingCustomerIds),
		enabled: missingCustomerIds.length > 0,
		fetcher: () => UserService.getUsers(undefined, undefined, missingCustomerIds, 0, 100),
	}));
	$effect(() => {
		for (const u of customers.items) customerNames.set(u.id, u.name ?? '');
	});

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
			// to a calendar event. Mirrors profileData's `bookingEvents`.
			const serviceMap = new SvelteMap(services.items.map((s) => [s.id, s.name]));
			return bookings.items.map((b) => {
				const serviceName = serviceMap.get(b.serviceId) ?? '';
				const customerName = customerNames.get(b.customerId) ?? '';
				return {
					id: `appt-${b.id}`,
					start: DateUtils.utcToLocalIso(b.startTime),
					end: DateUtils.utcToLocalIso(b.endTime),
					title: m.appointmentTitle({ customer: customerName, service: serviceName }),
					startEditable: false,
					durationEditable: false,
					classNames: eventAppointment,
					extendedProps: {
						eventType: 'appointment',
						bookingId: b.id,
						customerId: b.customerId,
						customerName,
						serviceId: b.serviceId,
						hasNotes: b.hasNotes,
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
		// The list only carries `hasNotes`; the note text comes from the booking
		// itself (staff may read any booking), fetched fresh when the dialog opens.
		getBookingNotes: async (bookingId) =>
			(await fetchResource(() => BookingService.getBookingById(bookingId)))?.notes ?? '-',
	};
}
