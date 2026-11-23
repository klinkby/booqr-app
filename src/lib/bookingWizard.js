// Paths into the customer booking wizard for an existing booking's Duplicate and
// Reschedule actions (profile booking list, admin plan panel). Relative to the app
// root: pass the result to `resolve()`.

export const PENDING_REBOOK_KEY = 'pendingRebook';

/**
 * Wizard path that books the same service with the same employee and location.
 * `customerId` books on that contact's behalf (honoured only for employees).
 * @param {{ serviceId: string|number, employeeId: string|number, locationId: string|number, customerId?: string|number|null }} booking
 * @param {string|null} [rebook] one-time reschedule nonce
 * @returns {string}
 */
export function duplicateBookingPath({ serviceId, employeeId, locationId, customerId = null }, rebook = null) {
	const params = new URLSearchParams();
	params.set('employee', String(employeeId));
	params.set('location', String(locationId));
	if (customerId) params.set('customer', String(customerId));
	if (rebook) params.set('rebook', rebook);
	return `book/${encodeURIComponent(serviceId)}?${params.toString()}`;
}

/**
 * Like {@link duplicateBookingPath}, but the old booking is deleted once the new one
 * is confirmed. The rebook intent is bound to a one-time nonce carried both in
 * sessionStorage and in the wizard URL; the confirm step deletes the old booking
 * only when the two match, so an unrelated booking for the same service (started
 * from any URL without this nonce) can never consume a stale token.
 * @param {{ id: string|number, serviceId: string|number, employeeId: string|number, locationId: string|number, customerId?: string|number|null }} booking
 * @returns {string}
 */
export function rescheduleBookingPath(booking) {
	const nonce = crypto.randomUUID();
	try {
		sessionStorage.setItem(PENDING_REBOOK_KEY, JSON.stringify({ bookingId: booking.id, nonce }));
	} catch {
		// sessionStorage unavailable — the new booking still goes through; the old one stays
	}
	return duplicateBookingPath(booking, nonce);
}
