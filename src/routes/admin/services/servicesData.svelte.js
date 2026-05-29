import { EmployeeService, ServiceService } from '$lib/api';
import { queryKeys } from '$lib/queryKeys';
import { useResourceQuery } from '$lib/resourceQuery.svelte.js';

/**
 * Route-local data hook for the services list page. Fetches services and the
 * employee roster in parallel so each service row can resolve employee names.
 */
export function useServicesData() {
	const services = useResourceQuery(() => ({
		queryKey: queryKeys.services.all,
		fetcher: () => ServiceService.getServices(0, 100),
	}));

	const employees = useResourceQuery(() => ({
		queryKey: queryKeys.employees.all,
		fetcher: () => EmployeeService.getEmployees(0, 100),
	}));

	const rows = $derived.by(() => {
		const empMap = Object.fromEntries(employees.items.map((e) => [e.id, e]));
		return services.items.map((s) => ({
			...s,
			employeeUsers: (s.employees || []).map((id) => empMap[id]).filter(Boolean),
		}));
	});

	return {
		get rows() {
			return rows;
		},
		get isLoading() {
			return services.isLoading || employees.isLoading;
		},
		get error() {
			return services.error || employees.error;
		},
	};
}
