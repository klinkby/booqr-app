import { afterEach, describe, expect, it, vi } from 'vitest';
import { duplicateBookingPath, PENDING_REBOOK_KEY, rescheduleBookingPath } from './bookingWizard.js';

const booking = { id: 'b1', serviceId: 'svc1', employeeId: 'emp1', locationId: 7 };

describe('duplicateBookingPath', () => {
	it('carries employee and location', () => {
		expect(duplicateBookingPath(booking)).toBe('book/svc1?employee=emp1&location=7');
	});

	it('books on the customer’s behalf when a customer is given', () => {
		expect(duplicateBookingPath({ ...booking, customerId: 42 })).toBe('book/svc1?employee=emp1&location=7&customer=42');
	});
});

describe('rescheduleBookingPath', () => {
	afterEach(() => vi.unstubAllGlobals());

	it('stores the old booking with a nonce that matches the URL', () => {
		const store = new Map();
		vi.stubGlobal('sessionStorage', { setItem: (k, v) => store.set(k, v) });
		const path = rescheduleBookingPath({ ...booking, customerId: 42 });
		const nonce = new URLSearchParams(path.split('?')[1]).get('rebook');
		expect(nonce).toBeTruthy();
		expect(path).toBe(`book/svc1?employee=emp1&location=7&customer=42&rebook=${nonce}`);
		expect(JSON.parse(store.get(PENDING_REBOOK_KEY))).toEqual({ bookingId: 'b1', nonce });
	});

	it('still returns a path when sessionStorage is unavailable', () => {
		vi.stubGlobal('sessionStorage', {
			setItem: () => {
				throw new Error('denied');
			},
		});
		expect(rescheduleBookingPath(booking)).toMatch(/^book\/svc1\?employee=emp1&location=7&rebook=/);
	});
});
