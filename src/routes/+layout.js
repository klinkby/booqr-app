import {EmployeeService, LocationService, ServiceService} from '$lib/api';

export async function load() {
	const [locationsRes, servicesRes, employeesRes] = await Promise.all([
		LocationService.getLocations(0, 100),
		ServiceService.getServices(0, 100),
		EmployeeService.getEmployees(0, 100)
	]);

	return {
		locations: locationsRes.items,
		services: servicesRes.items,
		employees: employeesRes.items
	};
}
