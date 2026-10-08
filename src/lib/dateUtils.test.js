import { describe, expect, it, vi } from 'vitest';

// Mock the generated Paraglide messages so `formatDuration`'s branch choice is
// what's asserted, not the generated locale output. The shapes mirror the real
// templates in messages/en.json.
vi.mock('$lib/paraglide/messages.js', () => ({
	m: {
		durationMinutes: ({ minutes }) => `${minutes} min`,
		durationHours: ({ hours }) => `${hours} h`,
		durationHoursMinutes: ({ hours, minutes }) => `${hours} h ${minutes} min`,
	},
}));

const { DateUtils } = await import('./dateUtils.js');

describe('parseDurationSeconds', () => {
	it('returns 0 for nullish / empty input', () => {
		expect(DateUtils.parseDurationSeconds(null)).toBe(0);
		expect(DateUtils.parseDurationSeconds(undefined)).toBe(0);
		expect(DateUtils.parseDurationSeconds('')).toBe(0);
	});

	it('parses HH:MM:SS including seconds', () => {
		expect(DateUtils.parseDurationSeconds('01:10:10')).toBe(3600 + 600 + 10);
	});

	it('treats missing trailing parts as zero', () => {
		expect(DateUtils.parseDurationSeconds('00:30')).toBe(1800); // HH:MM
		expect(DateUtils.parseDurationSeconds('02')).toBe(7200); // HH only
	});

	it('returns 0 when any part is non-numeric', () => {
		expect(DateUtils.parseDurationSeconds('01:xx:00')).toBe(0);
	});
});

describe('formatDuration', () => {
	it('shows minutes only when under an hour', () => {
		expect(DateUtils.formatDuration('00:30:00')).toBe('30 min');
	});

	it('shows hours only when on a whole hour', () => {
		expect(DateUtils.formatDuration('02:00:00')).toBe('2 h');
	});

	it('shows hours and minutes together', () => {
		expect(DateUtils.formatDuration('01:10:00')).toBe('1 h 10 min');
	});

	it('rounds seconds to the nearest minute', () => {
		expect(DateUtils.formatDuration('00:00:50')).toBe('1 min'); // 50s -> 1 min
	});
});

describe('toLocalDate / toLocalTime', () => {
	it('formats a Date to zero-padded local Y-M-D and HH:MM', () => {
		const d = new Date(2026, 0, 5, 7, 3); // local Jan 5 2026 07:03
		expect(DateUtils.toLocalDate(d)).toBe('2026-01-05');
		expect(DateUtils.toLocalTime(d)).toBe('07:03');
	});
});

describe('utcToLocalIso', () => {
	it('renders a UTC instant in local time with a T separator', () => {
		// Build the local wall-clock expectation from the same instant so the
		// assertion is timezone-independent.
		const instant = new Date(2026, 5, 1, 14, 45);
		const utc = instant.toISOString();
		expect(DateUtils.utcToLocalIso(utc)).toBe(`${DateUtils.toLocalDate(instant)}T${DateUtils.toLocalTime(instant)}`);
	});
});
