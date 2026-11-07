import { describe, expect, it } from 'vitest';
import { takeoutFileName } from './takeout.js';

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
