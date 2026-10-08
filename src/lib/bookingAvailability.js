import { DateUtils } from '$lib/dateUtils.js';

/**
 * Pure, side-effect-free availability arithmetic for the customer booking
 * wizard (`/book/[serviceId]` steps 2–5). Extracted from `bookingData.svelte.js`
 * so the slot/vacancy math is unit-testable in isolation — the reactive hook
 * `useBookingData` composes these static methods inside its `$derived`s.
 *
 * The server splits a vacancy on booking, so `bookingId === null` plus a window
 * ≥ the service's duration is exactly "bookable" (see [[vacancy-split-on-booking]]).
 *
 * This file is deliberately plain `.js` (not `.svelte.js`): the `new Date` /
 * `new Set` values built here are fresh, immediately-consumed values, never
 * reactive state, so they must live outside `eslint-plugin-svelte`'s
 * prefer-svelte-reactivity scope.
 */
export class BookingAvailability {
	/** Milliseconds in one 15-minute grid step. */
	static SLOT_STEP_MS = 15 * 60 * 1000;

	/** Local `Date` for the first day of the 'YYYY-MM' month string. */
	static monthStart(monthStr) {
		const [y, m] = monthStr.split('-').map(Number);
		return new Date(y, m - 1, 1);
	}

	/** First day of the month `n` months after `date` (n may be negative). */
	static addMonths(date, n) {
		return new Date(date.getFullYear(), date.getMonth() + n, 1);
	}

	/** Today's local date as 'YYYY-MM-DD'. */
	static todayStr() {
		return DateUtils.toLocalDate(new Date());
	}

	/**
	 * Rounds an epoch-ms value up to the next 15-minute-of-the-hour boundary
	 * (never down). Real-world UTC offsets are always whole multiples of 15
	 * minutes, so rounding the raw epoch value lines up with the LOCAL clock's
	 * :00/:15/:30/:45 grid too.
	 */
	static nextGridTimeMs(ms) {
		const rem = ms % BookingAvailability.SLOT_STEP_MS;
		return rem === 0 ? ms : ms + (BookingAvailability.SLOT_STEP_MS - rem);
	}

	/** Every 15-minute-grid start time in `vacancy` — at or after `minStartMs` — that leaves room for `durationMs`. */
	static slotsForVacancy(vacancy, durationMs, minStartMs) {
		const vacStartMs = new Date(vacancy.startTime).getTime();
		const vacEndMs = new Date(vacancy.endTime).getTime();
		let curMs = BookingAvailability.nextGridTimeMs(Math.max(vacStartMs, minStartMs));
		const slots = [];
		while (curMs + durationMs <= vacEndMs) {
			slots.push(new Date(curMs));
			curMs += BookingAvailability.SLOT_STEP_MS;
		}
		return slots;
	}

	/** Employees that can perform `service`, from the full `allEmployees` list. */
	static computeServiceEmployees(service, allEmployees) {
		if (!service) return [];
		const ids = new Set((service.employees ?? []).map(String));
		return allEmployees.filter((e) => ids.has(String(e.id)));
	}

	/** Bookable for this service, regardless of the user's location/employee choice yet. */
	static computeCandidateVacancies(service, vacancies, durationMs, nowMs) {
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
	static computeDaysWithSlots(selectedVacancies, durationMs, nowMs) {
		const set = new Set();
		if (durationMs <= 0) return set;
		for (const v of selectedVacancies) {
			for (const slot of BookingAvailability.slotsForVacancy(v, durationMs, nowMs)) {
				set.add(DateUtils.toLocalDate(slot));
			}
		}
		return set;
	}

	/** Concrete bookable slots on `dateStr` (local), sorted ascending by start time. */
	static computeSlotsForDate(selectedVacancies, dateStr, durationMs, nowMs) {
		if (durationMs <= 0 || !dateStr) return [];
		const results = [];
		for (const v of selectedVacancies) {
			if (DateUtils.toLocalDate(new Date(v.startTime)) !== dateStr) continue;
			for (const slot of BookingAvailability.slotsForVacancy(v, durationMs, nowMs)) {
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
}
