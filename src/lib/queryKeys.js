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
		// Anchor month ('YYYY-MM') for the customer booking wizard's availability
		// hook. The hook fetches a wider horizon around the anchor (see
		// bookingData.svelte.js) but keys the cache on the anchor alone, so
		// paging the month grid one step at a time doesn't refetch the whole
		// overlapping window twice.
		month: (serviceId, anchorMonth) => [...queryKeys.vacancies.all, 'month', serviceId, anchorMonth],
	},
	bookings: {
		all: ['bookings'],
		// A user's full my-bookings set (fetched without query params; filtered
		// and paged client-side by the profile calendar).
		byUser: (userId) => [...queryKeys.bookings.all, userId],
		// A user's my-bookings scoped to a week range (admin plan overlay).
		userRange: (userId, from, to) => [...queryKeys.bookings.all, userId, from, to],
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
		// `k` (name) and `roles` (array) vary per contacts-filter state; each
		// combination caches separately while still sharing the `all` prefix.
		paged: (k, roles) => [...queryKeys.users.all, 'paged', k ?? null, roles ?? null],
		// UserService.getUsers(role='Employee') → /api/users?Role=Employee.
		// IDs match user IDs stored in services.employees / vacancy.employeeId.
		employees: ['users', 'employees'],
	},
};
