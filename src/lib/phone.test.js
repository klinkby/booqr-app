import { describe, expect, it } from 'vitest';
import { decodePhone, encodePhone, isValidPhone, phoneRange } from './phone.js';

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

describe('phoneRange', () => {
	it('includes the caller code in the numeric range', () => {
		expect(phoneRange('45')).toEqual({ min: 4510000000n, max: 4599999999n });
		expect(phoneRange('999')).toBeNull();
	});
});

describe('isValidPhone', () => {
	it('accepts numbers inside the country range', () => {
		expect(isValidPhone('4512345678')).toBe(true);
		expect(isValidPhone('48123456789')).toBe(true);
		expect(isValidPhone('358401234567')).toBe(true);
	});
	it('rejects too short, too long, non-numeric and unknown-prefix values', () => {
		expect(isValidPhone('451234567')).toBe(false);
		expect(isValidPhone('45123456789')).toBe(false);
		expect(isValidPhone('45 12345678')).toBe(false);
		expect(isValidPhone('3312345678')).toBe(false);
		expect(isValidPhone('')).toBe(false);
	});
});
