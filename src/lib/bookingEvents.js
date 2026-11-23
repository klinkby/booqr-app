import { DateUtils } from '#lib/dateUtils.js';

/**
 * Maps the user's bookings to calendar events, joining each booking's
 * serviceId/employeeId/locationId to a display name.
 *
 * Transient id→name lookups are built per call; they are not reactive state.
 *
 * `manageable` is supplied by the caller via `isManageable` so the domain rule
 * (who may reschedule or cancel, and when) stays with the caller. It is
 * evaluated against the raw booking, so it can use the UTC startTime vs. now,
 * both true epochs, which is timezone-correct.
 *
 * @param {Array<{id, startTime, endTime, serviceId, employeeId, locationId, customerId}>} bookings
 * @param {{ services: Array<{id, name}>, locations: Array<{id, name}>, employees: Array<{id, name}> }} lookups
 * @param {(booking: object) => boolean} isManageable
 * @returns {Array<{id, start: string, end: string, title: string, extendedProps: object}>}
 */
export function toBookingEvents(bookings, { services, locations, employees }, isManageable) {
	const serviceMap = new Map(services.map((s) => [s.id, s.name]));
	const locationMap = new Map(locations.map((l) => [l.id, l.name]));
	const employeeMap = new Map(employees.map((e) => [e.id, e.name]));

	return bookings.map((b) => {
		const serviceName = serviceMap.get(b.serviceId) ?? '';
		const employeeName = employeeMap.get(b.employeeId) ?? '';
		const locationName = locationMap.get(b.locationId) ?? '';
		return {
			id: b.id,
			start: DateUtils.utcToLocalIso(b.startTime),
			end: DateUtils.utcToLocalIso(b.endTime),
			// Plain title for the library's own use (accessible name, tooltip).
			// The calendar's eventContent renders the styled variant from the
			// separate parts below: "<time> <service>" bold, then "(employee)
			// @ location".
			title: `${serviceName} (${employeeName}) @ ${locationName}`,
			extendedProps: {
				serviceName,
				employeeName,
				locationName,
				manageable: isManageable(b),
				serviceId: b.serviceId,
				employeeId: b.employeeId,
				locationId: b.locationId,
				customerId: b.customerId,
			},
		};
	});
}
