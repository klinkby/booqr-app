import { describe, expect, it, vi } from 'vitest';
import { toBookingEvents } from './bookingEvents.js';
import { DateUtils } from './dateUtils.js';

const booking = {
	id: 'b1',
	startTime: '2026-06-01T12:00:00Z',
	endTime: '2026-06-01T13:00:00Z',
	serviceId: 'svc1',
	employeeId: 'emp1',
	locationId: 7,
	customerId: 42,
};

const lookups = {
	services: [{ id: 'svc1', name: 'Haircut' }],
	locations: [{ id: 7, name: 'Main street' }],
	employees: [{ id: 'emp1', name: 'Ann' }],
};

describe('toBookingEvents', () => {
	it('joins service, employee and location names into the title', () => {
		const [event] = toBookingEvents([booking], lookups, () => true);
		expect(event.title).toBe('Haircut (Ann) @ Main street');
		expect(event.extendedProps).toMatchObject({
			serviceName: 'Haircut',
			employeeName: 'Ann',
			locationName: 'Main street',
		});
	});

	it('uses an empty string for missing names', () => {
		const [event] = toBookingEvents([booking], { services: [], locations: [], employees: [] }, () => true);
		expect(event.title).toBe(' () @ ');
		expect(event.extendedProps).toMatchObject({ serviceName: '', employeeName: '', locationName: '' });
	});

	it('converts start and end to local ISO strings', () => {
		const [event] = toBookingEvents([booking], lookups, () => true);
		expect(event.id).toBe('b1');
		expect(event.start).toBe(DateUtils.utcToLocalIso(booking.startTime));
		expect(event.end).toBe(DateUtils.utcToLocalIso(booking.endTime));
	});

	it('passes the raw booking to the predicate and uses its result as manageable', () => {
		const isManageable = vi.fn(() => false);
		const [event] = toBookingEvents([booking], lookups, isManageable);
		expect(isManageable).toHaveBeenCalledWith(booking);
		expect(event.extendedProps.manageable).toBe(false);
	});

	it('passes ids and customerId through', () => {
		const [event] = toBookingEvents([booking], lookups, () => true);
		expect(event.extendedProps).toMatchObject({
			serviceId: 'svc1',
			employeeId: 'emp1',
			locationId: 7,
			customerId: 42,
		});
	});

	it('returns an empty array for no bookings', () => {
		expect(toBookingEvents([], lookups, () => true)).toEqual([]);
	});
});
