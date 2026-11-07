import { describe, expect, it } from 'vitest';
import { importSummaryRows, parseTakeoutFile, takeoutFileName } from './takeout.js';

describe('takeoutFileName', () => {
	it('combines tenant slug and the UTC date of exportedAt', () => {
		expect(takeoutFileName({ tenantSlug: 'acme', exportedAt: '2026-11-07T23:30:00Z' })).toBe(
			'booqr-takeout-acme-2026-11-07.json',
		);
	});

	it('sanitises unsafe characters in the slug', () => {
		expect(takeoutFileName({ tenantSlug: '../a/b c', exportedAt: '2026-01-02T00:00:00Z' })).toBe(
			'booqr-takeout-a-b-c-2026-01-02.json',
		);
	});

	it('falls back gracefully when fields are missing', () => {
		expect(takeoutFileName({})).toBe('booqr-takeout.json');
		expect(takeoutFileName(null)).toBe('booqr-takeout.json');
	});
});

describe('parseTakeoutFile', () => {
	const valid = { schemaVersion: 1, users: [], locations: [], services: [], bookings: [], calendar: [] };

	it('returns the document when it has every entity list', () => {
		expect(parseTakeoutFile(JSON.stringify(valid))).toEqual(valid);
	});

	it.each([
		['not JSON', '{oops'],
		['a JSON array', '[]'],
		['JSON null', 'null'],
		['a missing list', JSON.stringify({ ...valid, calendar: undefined })],
		['a list that is not an array', JSON.stringify({ ...valid, users: {} })],
	])('returns null for %s', (_, text) => {
		expect(parseTakeoutFile(text)).toBeNull();
	});
});

describe('importSummaryRows', () => {
	it('lists every entity in display order with numeric counts', () => {
		const rows = importSummaryRows({
			users: { created: 2, matched: '3', skipped: 0 },
			calendar: { created: 1, matched: 0, skipped: 4 },
		});
		expect(rows.map((r) => r.key)).toEqual(['users', 'locations', 'services', 'bookings', 'calendar']);
		expect(rows[0]).toEqual({ key: 'users', created: 2, matched: 3, skipped: 0 });
		expect(rows[1]).toEqual({ key: 'locations', created: 0, matched: 0, skipped: 0 });
		expect(rows[4]).toEqual({ key: 'calendar', created: 1, matched: 0, skipped: 4 });
	});
});
