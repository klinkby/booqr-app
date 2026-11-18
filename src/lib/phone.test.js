import { describe, expect, it } from 'vitest';
import { decodePhone, encodePhone, formatPhone, nationalPattern, telHref } from './phone.js';

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

describe('nationalPattern', () => {
	it('bounds the subscriber number per country', () => {
		expect(new RegExp(`^${nationalPattern('45')}$`).test('12345678')).toBe(true);
		expect(new RegExp(`^${nationalPattern('45')}$`).test('1234567')).toBe(false);
		expect(new RegExp(`^${nationalPattern('48')}$`).test('123456789')).toBe(true);
		expect(new RegExp(`^${nationalPattern('358')}$`).test('401234567')).toBe(true);
	});
});

describe('telHref', () => {
	it('prefixes the stored calling code with a plus sign', () => {
		expect(telHref('4512345678')).toBe('tel:+4512345678');
	});
	it('drops formatting characters and does not double the plus', () => {
		expect(telHref('+45 12 34-56 78')).toBe('tel:+4512345678');
	});
});

describe('formatPhone', () => {
	it('shows a known calling code with a plus, separated from the subscriber number', () => {
		expect(formatPhone('4512345678')).toBe('+45 12345678');
		expect(formatPhone('35812345')).toBe('+358 12345');
	});
	it('drops formatting characters first', () => {
		expect(formatPhone('+45 12 34-56 78')).toBe('+45 12345678');
	});
	it('leaves a value without a known calling code as bare digits', () => {
		expect(formatPhone('12345678')).toBe('12345678');
	});
});
