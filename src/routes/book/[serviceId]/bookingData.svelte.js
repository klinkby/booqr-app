import { EmployeeService, LocationService, ServiceService, VacancyService } from '$lib/api';
import { BookingAvailability } from '$lib/bookingAvailability.js';
import { DateUtils } from '$lib/dateUtils.js';
import { queryKeys } from '$lib/queryKeys';
import { fetchAllPages, useResourceQuery } from '$lib/resourceQuery.svelte.js';

// Bounded lookahead for "does any later month/day have availability" checks —
// businesses publish vacancies a few months out at most in practice. Widening
// this only costs one extra query param, not extra requests.
const HORIZON_MONTHS_AHEAD = 6;

// All Date/Set arithmetic lives in the pure `BookingAvailability` class
// (`$lib/bookingAvailability.js`), kept out of this .svelte.js module so it is
// unit-testable and outside `eslint-plugin-svelte`'s prefer-svelte-reactivity
// scope. None of those values are reactive state — each is a fresh,
// immediately-consumed value — so the hook below just composes them in
// `$derived`s.

/**
 * Route-local availability hook for the customer booking wizard
 * (`/book/[serviceId]` steps 2–5). Fetches services, employees, locations and
 * a multi-month window of vacancies, then derives everything the wizard steps
 * need client-side — the server splits a vacancy on booking, so
 * `bookingId === null` plus a window ≥ the service's duration is exactly
 * "bookable" (see [[vacancy-split-on-booking]]).
 *
 * All params are read **inside** the query thunks so navigation refetches.
 *
 * @param {() => { serviceId: string, locationId: string|null, employeeId: string|null, month: string, date: string|null }} getParams
 *   `month` is the anchor 'YYYY-MM' for the visible grid; `date` is the
 *   selected 'YYYY-MM-DD' or null.
 */
export function useBookingData(getParams) {
	const vacanciesQuery = useResourceQuery(() => {
		const { serviceId, month } = getParams();
		const anchor = BookingAvailability.monthStart(month);
		const from = BookingAvailability.addMonths(anchor, -1);
		const to = BookingAvailability.addMonths(anchor, HORIZON_MONTHS_AHEAD + 1);
		return {
			queryKey: queryKeys.vacancies.month(serviceId, month),
			enabled: !!serviceId,
			fetcher: () =>
				fetchAllPages((start, num) => VacancyService.getVacancies(from.toISOString(), to.toISOString(), start, num)),
		};
	});

	const servicesQuery = useResourceQuery(() => ({
		queryKey: queryKeys.services.all,
		fetcher: () => ServiceService.getServices(0, 100),
	}));

	const employeesQuery = useResourceQuery(() => ({
		queryKey: queryKeys.employees.all,
		fetcher: () => EmployeeService.getEmployees(),
	}));

	const locationsQuery = useResourceQuery(() => ({
		queryKey: queryKeys.locations.all,
		fetcher: () => LocationService.getLocations(0, 100),
	}));

	const service = $derived.by(() => {
		const { serviceId } = getParams();
		return servicesQuery.items.find((s) => String(s.id) === String(serviceId));
	});

	const serviceDurationSeconds = $derived(DateUtils.parseDurationSeconds(service?.duration));
	const durationMs = $derived(serviceDurationSeconds * 1000);

	const serviceEmployees = $derived.by(() =>
		BookingAvailability.computeServiceEmployees(service, employeesQuery.items),
	);

	const candidateVacancies = $derived.by(() =>
		BookingAvailability.computeCandidateVacancies(service, vacanciesQuery.items, durationMs, Date.now()),
	);

	// Narrowed to the user's chosen location/employee — drives the day and
	// time-slot views.
	const selectedVacancies = $derived.by(() => {
		const { locationId, employeeId } = getParams();
		return candidateVacancies.filter(
			(v) =>
				(!locationId || String(v.locationId) === String(locationId)) &&
				(!employeeId || String(v.employeeId) === String(employeeId)),
		);
	});

	// Drives the month grid AND, via `sortedAvailableDates`, which day
	// Prev/Next jump to.
	const daysWithSlots = $derived.by(() =>
		BookingAvailability.computeDaysWithSlots(selectedVacancies, durationMs, Date.now()),
	);

	const sortedAvailableDates = $derived(Array.from(daysWithSlots).sort());

	const nextAvailableDate = $derived.by(() => {
		const { date } = getParams();
		const reference = date || BookingAvailability.todayStr();
		return sortedAvailableDates.find((d) => d > reference) ?? null;
	});

	const previousAvailableDate = $derived.by(() => {
		const { date } = getParams();
		const today = BookingAvailability.todayStr();
		const reference = date || today;
		let result = null;
		for (const d of sortedAvailableDates) {
			if (d >= reference) break;
			if (d >= today) result = d;
		}
		return result;
	});

	// True once any available day falls in a month later than the displayed
	// one — drives the month grid's Next-month disabled state.
	const hasLaterMonthAvailability = $derived.by(() => {
		const { month } = getParams();
		return sortedAvailableDates.some((d) => d.slice(0, 7) > month);
	});

	function slotsForDate(dateStr) {
		return BookingAvailability.computeSlotsForDate(selectedVacancies, dateStr, durationMs, Date.now());
	}

	return {
		get service() {
			return service;
		},
		get serviceDurationSeconds() {
			return serviceDurationSeconds;
		},
		get allLocations() {
			return locationsQuery.items;
		},
		get serviceEmployees() {
			return serviceEmployees;
		},
		get daysWithSlots() {
			return daysWithSlots;
		},
		get hasLaterMonthAvailability() {
			return hasLaterMonthAvailability;
		},
		get nextAvailableDate() {
			return nextAvailableDate;
		},
		get previousAvailableDate() {
			return previousAvailableDate;
		},
		slotsForDate,
		get isLoading() {
			return (
				vacanciesQuery.isLoading || servicesQuery.isLoading || employeesQuery.isLoading || locationsQuery.isLoading
			);
		},
		get error() {
			return vacanciesQuery.error || servicesQuery.error || employeesQuery.error || locationsQuery.error;
		},
	};
}
