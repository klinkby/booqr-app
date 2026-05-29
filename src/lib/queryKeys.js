/**
 * Central registry of svelte-query keys — the single source of truth so a
 * query and its invalidation can never silently drift via a typo (the #1
 * scaling hazard once this pattern is copied across routes).
 *
 * One entry per resource. Convention:
 *   - `all`: the resource prefix array; pass to `invalidateQueries` to match
 *     every cached variant of the resource by prefix (coarse invalidation).
 *   - factory fns (e.g. `range`, `detail`): extend `all` with parameters so
 *     each variant caches separately while still sharing the `all` prefix.
 *
 * Template: when adding a new query-backed resource, add its block here first,
 * then reference these keys from the route-local `use<Resource>` hook.
 */
export const queryKeys = {
	vacancies: {
		all: ['vacancies'],
		range: (from, to) => [...queryKeys.vacancies.all, from, to],
	},
	bookings: {
		all: ['bookings'],
		range: (userId, from, to) => [...queryKeys.bookings.all, userId, from, to],
	},
	locations: {
		all: ['locations'],
		paged: ['locations', 'paged'],
	},
	services: {
		all: ['services'],
	},
	employees: {
		// EmployeeService.getEmployees() → /api/employees — distinct endpoint and
		// id-space from UserService; used only for booking-calendar display on `/`.
		// NOT invalidated by user mutations (separate resource).
		all: ['employees'],
	},
	users: {
		// Every UserService.getUsers / getUserById-derived view lives under this
		// prefix so a single coarse invalidate(`users.all`) refreshes them all:
		// the contacts list, the employee-filtered roster, and the profile.
		all: ['users'],
		detail: (id) => [...queryKeys.users.all, id],
		paged: ['users', 'paged'],
		// UserService.getUsers(role='Employee') → /api/users?Role=Employee.
		// IDs match user IDs stored in services.employees / vacancy.employeeId.
		employees: ['users', 'employees'],
	},
};
