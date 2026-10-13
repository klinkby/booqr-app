import { describe, expect, it } from 'vitest';
import { decodePhone, encodePhone } from './phone.js';

describe('decodePhone', () => {
	it('splits two- and three-digit calling codes', () => {
		expect(decodePhone('4512345678')).toEqual({ code: '45', national: '12345678', matched: true });
		expect(decodePhone('358401234567')).toEqual({ code: '358', national: '401234567', matched: true });
	});
	it('falls back to the default code for unknown prefixes and empty values', () => {
		expect(decodePhone('3312345678').matched).toBe(false);
		expect(decodePhone('')).toEqual({ code: '45', national: '', matched: false });
		expect(decodePhone(undefined).national).toBe('');
	});
});

describe('encodePhone', () => {
	it('round-trips with decodePhone', () => {
		for (const v of ['4512345678', '372512345678', '48123456789']) {
			const { code, national } = decodePhone(v);
			expect(encodePhone(code, national)).toBe(v);
		}
	});
	it('strips non-digits and returns empty for no subscriber number', () => {
		expect(encodePhone('45', '12 34-56')).toBe('45123456');
		expect(encodePhone('45', '')).toBe('');
	});
});
