import { describe, expect, it } from 'vitest';
// `$app/environment` is aliased to a stub (browser = false) in vitest.config.js,
// so importing this runes module runs no browser-only bootstrap side effects.
import { MARKETING_URL, hostCategory } from './tenant.svelte.js';

describe('hostCategory', () => {
	it.each(['booqr.dk', 'www.booqr.dk', 'status.booqr.dk', 'mta-sts.booqr.dk'])(
		'classifies reserved host %s as "reserved"',
		(host) => {
			expect(hostCategory(host)).toBe('reserved');
		},
	);

	it.each(['acme.booqr.dk', 'any-slug.booqr.dk', 'localhost', 'preview-123.example.com'])(
		'classifies %s as a tenant candidate',
		(host) => {
			expect(hostCategory(host)).toBe('tenant');
		},
	);
});

describe('MARKETING_URL', () => {
	it('is the www apex derived from the base domain', () => {
		expect(MARKETING_URL).toBe('https://www.booqr.dk');
	});
});
