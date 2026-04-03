import {LocationService, UserService} from '$lib/api';
import {invokeApi} from '$lib/invokeApi';

export async function load() {
	const [locationsRes, usersRes] = await Promise.all([
		invokeApi(() => LocationService.getLocations()),
		invokeApi(() => UserService.getUsers(undefined, 'Employee'))
	]);

	return {
		locations: locationsRes.items,
		employees: usersRes.items
	};
}
