import { EmployeeService, ServiceService } from '$lib/api';
import { queryKeys } from '$lib/queryKeys';
import { fetchResource, useResourceMutation, useResourceQuery } from '$lib/resourceQuery.svelte.js';

/**
 * Route-local data hook for the service create/edit form. Fetches the
 * employee roster and (in edit mode) the existing service detail.
 *
 */
export function useServiceData() {
	const employees = useResourceQuery(() => ({
		queryKey: queryKeys.employees.all,
		fetcher: () => EmployeeService.getEmployees(0, 100),
	}));

	const saveService = useResourceMutation(queryKeys.services.all, (variables) => {
		const { id, isEdit, payload } = variables;
		return isEdit ? ServiceService.updateService(id, payload) : ServiceService.addService(payload);
	});

	return {
		get employees() {
			return employees.items;
		},
		get isLoading() {
			return employees.isLoading;
		},
		get error() {
			return employees.error;
		},
		// Always-fresh detail fetch for edit mode; returns the service object.
		getService: (id) => fetchResource(() => ServiceService.getServiceById(id)),
		saveService: (variables) => saveService(variables),
	};
}
