export const ssr = false;

import { EmployeeService, LocationService, ServiceService } from '$lib/api';
import { OpenAPI } from '$lib/api/core/OpenAPI';

export async function load({ fetch }) {
	OpenAPI.FETCH = fetch;
	const [locationsRes, servicesRes, employeesRes] = await Promise.all([
		LocationService.getLocations(0, 100),
		ServiceService.getServices(0, 100),
		EmployeeService.getEmployees(0, 100),
	]);

	return {
		locations: locationsRes.items,
		services: servicesRes.items,
		employees: employeesRes.items,
	};
}
