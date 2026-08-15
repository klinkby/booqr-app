import { EmployeeService, LocationService, ServiceService, VacancyService } from '$lib/api';
import { DateUtils } from '$lib/dateUtils.js';
import { queryKeys } from '$lib/queryKeys';
import { fetchAllPages, useResourceQuery } from '$lib/resourceQuery.svelte.js';

const SLOT_STEP_MS = 15 * 60 * 1000;
// Bounded lookahead for "does any later month/day have availability" checks —
// businesses publish vacancies a few months out at most in practice. Widening
// this only costs one extra query param, not extra requests.
const HORIZON_MONTHS_AHEAD = 6;

// All Date/Set construction lives in these plain, non-exported helpers
// (never in `useBookingData` itself). `eslint-plugin-svelte`'s
// prefer-svelte-reactivity rule blanket-flags every `new Date`/`new Set`
// textually inside an *exported* .svelte.js declaration — regardless of
// whether it's actually mutated — on the assumption it feeds reactive state.
// None of these values are reactive state (no setters ever called; each is a
// fresh, immediately-consumed value), so keeping their construction outside
// the exported function is the correct fix, not a suppression.

function monthStart(monthStr) {
	const [y, m] = monthStr.split('-').map(Number);
	return new Date(y, m - 1, 1);
}

function addMonths(date, n) {
	return new Date(date.getFullYear(), date.getMonth() + n, 1);
}

function todayStr() {
	return DateUtils.toLocalDate(new Date());
}

/**
 * Rounds an epoch-ms value up to the next 15-minute-of-the-hour boundary
 * (never down). Real-world UTC offsets are always whole multiples of 15
 * minutes, so rounding the raw epoch value lines up with the LOCAL clock's
 * :00/:15/:30/:45 grid too.
 */
function nextGridTimeMs(ms) {
	const rem = ms % SLOT_STEP_MS;
	return rem === 0 ? ms : ms + (SLOT_STEP_MS - rem);
}

/** Every 15-minute-grid start time in `vacancy` — at or after `minStartMs` — that leaves room for `durationMs`. */
function slotsForVacancy(vacancy, durationMs, minStartMs) {
	const vacStartMs = new Date(vacancy.startTime).getTime();
	const vacEndMs = new Date(vacancy.endTime).getTime();
	let curMs = nextGridTimeMs(Math.max(vacStartMs, minStartMs));
	const slots = [];
	while (curMs + durationMs <= vacEndMs) {
		slots.push(new Date(curMs));
		curMs += SLOT_STEP_MS;
	}
	return slots;
}

function computeServiceEmployees(service, allEmployees) {
	if (!service) return [];
	const ids = new Set((service.employees ?? []).map(String));
	return allEmployees.filter((e) => ids.has(String(e.id)));
}

/** Bookable for this service, regardless of the user's location/employee choice yet. */
function computeCandidateVacancies(service, vacancies, durationMs, nowMs) {
	if (!service || durationMs <= 0) return [];
	const employeeIds = new Set((service.employees ?? []).map(String));
	return vacancies.filter((v) => {
		if (v.bookingId !== null && v.bookingId !== undefined) return false;
		if (!employeeIds.has(String(v.employeeId))) return false;
		const endMs = new Date(v.endTime).getTime();
		if (endMs <= nowMs) return false;
		const startMs = new Date(v.startTime).getTime();
		return endMs - startMs >= durationMs;
	});
}

/** Set<'YYYY-MM-DD'> (local) — every day, across the fetched horizon, with at least one bookable slot. */
function computeDaysWithSlots(selectedVacancies, durationMs, nowMs) {
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- local accumulator, built fresh on every call and returned as a value; never shared mutable state
	const set = new Set();
	if (durationMs <= 0) return set;
	for (const v of selectedVacancies) {
		for (const slot of slotsForVacancy(v, durationMs, nowMs)) {
			set.add(DateUtils.toLocalDate(slot));
		}
	}
	return set;
}

function computeSlotsForDate(selectedVacancies, dateStr, durationMs, nowMs) {
	if (durationMs <= 0 || !dateStr) return [];
	const results = [];
	for (const v of selectedVacancies) {
		if (DateUtils.toLocalDate(new Date(v.startTime)) !== dateStr) continue;
		for (const slot of slotsForVacancy(v, durationMs, nowMs)) {
			results.push({
				vacancyId: v.id,
				employeeId: v.employeeId,
				locationId: v.locationId,
				startTime: slot,
				endTime: new Date(slot.getTime() + durationMs),
			});
		}
	}
	results.sort((a, b) => a.startTime - b.startTime);
	return results;
}

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
		const anchor = monthStart(month);
		const from = addMonths(anchor, -1);
		const to = addMonths(anchor, HORIZON_MONTHS_AHEAD + 1);
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

	const serviceEmployees = $derived.by(() => computeServiceEmployees(service, employeesQuery.items));

	const candidateVacancies = $derived.by(() =>
		computeCandidateVacancies(service, vacanciesQuery.items, durationMs, Date.now()),
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
	const daysWithSlots = $derived.by(() => computeDaysWithSlots(selectedVacancies, durationMs, Date.now()));

	const sortedAvailableDates = $derived(Array.from(daysWithSlots).sort());

	const nextAvailableDate = $derived.by(() => {
		const { date } = getParams();
		const reference = date || todayStr();
		return sortedAvailableDates.find((d) => d > reference) ?? null;
	});

	const previousAvailableDate = $derived.by(() => {
		const { date } = getParams();
		const today = todayStr();
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
		return computeSlotsForDate(selectedVacancies, dateStr, durationMs, Date.now());
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
