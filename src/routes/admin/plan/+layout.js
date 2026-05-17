import { LocationService, UserService } from '$lib/api';
import { OpenAPI } from '$lib/api/core/OpenAPI';
import { invokeApi } from '$lib/invokeApi';

export async function load({ fetch }) {
	OpenAPI.FETCH = fetch;
	const [locationsRes, usersRes] = await Promise.all([
		invokeApi(() => LocationService.getLocations()),
		invokeApi(() => UserService.getUsers(undefined, 'Employee')),
	]);

	return {
		locations: locationsRes.items,
		employees: usersRes.items,
	};
}
