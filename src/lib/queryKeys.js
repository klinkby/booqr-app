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
};
