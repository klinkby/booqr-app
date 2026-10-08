import { describe, expect, it } from 'vitest';
import { BookingAvailability } from './bookingAvailability.js';

// These tests exercise the pure slot/vacancy arithmetic extracted from the
// booking wizard hook. Time-of-day grouping (`computeDaysWithSlots`,
// `computeSlotsForDate`, `todayStr`) goes through `DateUtils.toLocalDate`, which
// is local-timezone-dependent — those cases build their vacancies with the
// local `Date(y, m, d, h, min)` constructor and a local-midnight epoch so the
// assertions hold under any `TZ` the runner uses. The ms-only methods
// (`nextGridTimeMs`, `slotsForVacancy`, `computeCandidateVacancies`) compare
// epoch values directly and are timezone-independent.

const HOUR_MS = 60 * 60 * 1000;
const STEP = BookingAvailability.SLOT_STEP_MS;

/** Epoch ms for a local wall-clock time — mirrors how vacancy ISO strings land after `new Date(...)`. */
const localMs = (y, m, d, h = 0, min = 0) => new Date(y, m - 1, d, h, min, 0, 0).getTime();

describe('nextGridTimeMs', () => {
	it('leaves a value already on a 15-minute boundary unchanged', () => {
		const onGrid = localMs(2026, 6, 1, 9, 15);
		expect(BookingAvailability.nextGridTimeMs(onGrid)).toBe(onGrid);
	});

	it('rounds up to the next boundary, never down', () => {
		const base = localMs(2026, 6, 1, 9, 0);
		expect(BookingAvailability.nextGridTimeMs(base + 60 * 1000)).toBe(base + STEP); // 09:01 -> 09:15
		expect(BookingAvailability.nextGridTimeMs(base + 14 * 60 * 1000)).toBe(base + STEP); // 09:14 -> 09:15
		expect(BookingAvailability.nextGridTimeMs(base + 16 * 60 * 1000)).toBe(base + 2 * STEP); // 09:16 -> 09:30
	});
});

describe('slotsForVacancy', () => {
	const vac = (startMs, endMs) => ({
		startTime: new Date(startMs).toISOString(),
		endTime: new Date(endMs).toISOString(),
	});

	it('enumerates every 15-minute start that leaves room for the duration', () => {
		const start = localMs(2026, 6, 1, 9, 0);
		const end = start + HOUR_MS; // one-hour window
		const slots = BookingAvailability.slotsForVacancy(vac(start, end), 30 * 60 * 1000, 0);
		// 30-min service in a 60-min window: 09:00, 09:15, 09:30 (09:45 would end 10:15 > 10:00)
		expect(slots.map((d) => d.getTime())).toEqual([start, start + STEP, start + 2 * STEP]);
	});

	it('returns no slots when the duration exceeds the window', () => {
		const start = localMs(2026, 6, 1, 9, 0);
		const slots = BookingAvailability.slotsForVacancy(vac(start, start + STEP), HOUR_MS, 0);
		expect(slots).toEqual([]);
	});

	it('starts at the grid boundary at or after minStartMs, not the vacancy start', () => {
		const start = localMs(2026, 6, 1, 9, 0);
		const end = start + 2 * HOUR_MS;
		const minStart = start + 20 * 60 * 1000; // 09:20 -> next grid is 09:30
		const slots = BookingAvailability.slotsForVacancy(vac(start, end), 30 * 60 * 1000, minStart);
		expect(slots[0].getTime()).toBe(start + 2 * STEP); // 09:30
	});
});

describe('computeServiceEmployees', () => {
	const employees = [{ id: 1 }, { id: 2 }, { id: 3 }];

	it('returns [] when service is nullish', () => {
		expect(BookingAvailability.computeServiceEmployees(null, employees)).toEqual([]);
	});

	it('filters to employees listed on the service, matching across string/number ids', () => {
		const service = { employees: ['1', 3] };
		expect(BookingAvailability.computeServiceEmployees(service, employees)).toEqual([{ id: 1 }, { id: 3 }]);
	});

	it('treats a missing employees array as empty', () => {
		expect(BookingAvailability.computeServiceEmployees({}, employees)).toEqual([]);
	});
});

describe('computeCandidateVacancies', () => {
	const now = localMs(2026, 6, 1, 8, 0);
	const service = { employees: ['10'] };
	const futureStart = now + HOUR_MS;
	const base = { employeeId: 10, bookingId: null };
	const vac = (over) => ({
		...base,
		startTime: new Date(futureStart).toISOString(),
		endTime: new Date(futureStart + HOUR_MS).toISOString(),
		...over,
	});

	it('returns [] when service is nullish or duration is non-positive', () => {
		expect(BookingAvailability.computeCandidateVacancies(null, [vac()], 1000, now)).toEqual([]);
		expect(BookingAvailability.computeCandidateVacancies(service, [vac()], 0, now)).toEqual([]);
	});

	it('keeps an unbooked, future, long-enough vacancy for a listed employee', () => {
		expect(BookingAvailability.computeCandidateVacancies(service, [vac()], 30 * 60 * 1000, now)).toHaveLength(1);
	});

	it('drops already-booked vacancies (bookingId set)', () => {
		expect(
			BookingAvailability.computeCandidateVacancies(service, [vac({ bookingId: 5 })], 30 * 60 * 1000, now),
		).toEqual([]);
	});

	it('drops vacancies for an employee not on the service', () => {
		expect(
			BookingAvailability.computeCandidateVacancies(service, [vac({ employeeId: 99 })], 30 * 60 * 1000, now),
		).toEqual([]);
	});

	it('drops vacancies that have already ended', () => {
		const past = vac({
			startTime: new Date(now - 2 * HOUR_MS).toISOString(),
			endTime: new Date(now - HOUR_MS).toISOString(),
		});
		expect(BookingAvailability.computeCandidateVacancies(service, [past], 30 * 60 * 1000, now)).toEqual([]);
	});

	it('drops vacancies shorter than the service duration', () => {
		const short = vac({ endTime: new Date(futureStart + 10 * 60 * 1000).toISOString() });
		expect(BookingAvailability.computeCandidateVacancies(service, [short], 30 * 60 * 1000, now)).toEqual([]);
	});
});

describe('computeDaysWithSlots', () => {
	it('returns an empty set for a non-positive duration', () => {
		expect(BookingAvailability.computeDaysWithSlots([{}], 0, 0).size).toBe(0);
	});

	it('collects the local dates of every vacancy that yields a slot', () => {
		const day1 = localMs(2026, 6, 1, 9, 0);
		const day3 = localMs(2026, 6, 3, 9, 0);
		const vacancies = [
			{ startTime: new Date(day1).toISOString(), endTime: new Date(day1 + HOUR_MS).toISOString() },
			{ startTime: new Date(day3).toISOString(), endTime: new Date(day3 + HOUR_MS).toISOString() },
		];
		const set = BookingAvailability.computeDaysWithSlots(vacancies, 30 * 60 * 1000, 0);
		expect([...set].sort()).toEqual(['2026-06-01', '2026-06-03']);
	});
});

describe('computeSlotsForDate', () => {
	it('returns [] for empty dateStr or non-positive duration', () => {
		expect(BookingAvailability.computeSlotsForDate([{}], '', 1000, 0)).toEqual([]);
		expect(BookingAvailability.computeSlotsForDate([{}], '2026-06-01', 0, 0)).toEqual([]);
	});

	it('returns only the requested date, sorted ascending, with correct slot metadata', () => {
		const dayStart = localMs(2026, 6, 1, 9, 0);
		const otherDay = localMs(2026, 6, 2, 9, 0);
		const duration = 30 * 60 * 1000;
		const vacancies = [
			{
				id: 'v2',
				employeeId: 10,
				locationId: 20,
				startTime: new Date(otherDay).toISOString(),
				endTime: new Date(otherDay + HOUR_MS).toISOString(),
			},
			{
				id: 'v1',
				employeeId: 11,
				locationId: 21,
				startTime: new Date(dayStart).toISOString(),
				endTime: new Date(dayStart + HOUR_MS).toISOString(),
			},
		];
		const slots = BookingAvailability.computeSlotsForDate(vacancies, '2026-06-01', duration, 0);
		expect(slots).toHaveLength(3); // 09:00, 09:15, 09:30
		expect(slots.every((s) => s.vacancyId === 'v1')).toBe(true);
		expect(slots[0]).toMatchObject({ vacancyId: 'v1', employeeId: 11, locationId: 21 });
		expect(slots[0].startTime.getTime()).toBe(dayStart);
		expect(slots[0].endTime.getTime()).toBe(dayStart + duration);
		// ascending
		expect(slots[1].startTime.getTime()).toBe(dayStart + STEP);
		expect(slots[2].startTime.getTime()).toBe(dayStart + 2 * STEP);
	});
});
