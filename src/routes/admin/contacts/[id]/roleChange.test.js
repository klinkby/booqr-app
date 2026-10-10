import { describe, expect, it } from 'vitest';
import { ROLES, canChangeRole } from './roleChange.js';

describe('ROLES', () => {
	it('lists the assignable roles', () => {
		expect(ROLES).toEqual(['Customer', 'Employee', 'Admin']);
	});
});

describe('canChangeRole', () => {
	it('is false for an employee', () => {
		expect(canChangeRole('Employee', '1', 'contact-42')).toBe(false);
	});

	it('is true for an admin changing another user', () => {
		expect(canChangeRole('Admin', '1', 'contact-42')).toBe(true);
	});

	it('is false for an admin viewing their own contact (number vs string ids)', () => {
		expect(canChangeRole('Admin', 1, '1')).toBe(false);
		expect(canChangeRole('Admin', '1', '1')).toBe(false);
	});

	it('is false when the viewer id is unknown', () => {
		expect(canChangeRole('Admin', null, 'contact-42')).toBe(false);
	});

	it('is false on the create page', () => {
		expect(canChangeRole('Admin', '1', 'new')).toBe(false);
	});
});
