import { OpenAPI } from '$lib/api/core/OpenAPI';
import { request } from '$lib/api/core/request';
import { UserService } from '$lib/api';
import { usePublicMutation } from '$lib/resourceQuery.svelte.js';

/**
 * Route-local data hook for the change-password page. Both calls are auth-flow
 * mutations wrapped in `usePublicMutation` (no 401 refresh-and-retry, no cache
 * invalidation):
 *
 * - `requestReset` emails a time-limited reset link (unauthenticated).
 * - `changePassword` posts the new password, authorized by the token carried in
 *   the URL query params (passed in from the page), not a JWT. Uses the
 *   low-level `request()` to preserve OpenAPI config per AGENTS.md.
 */
export function useChangePasswordData() {
	const requestReset = usePublicMutation((email) => UserService.resetPassword({ email }));

	const changePassword = usePublicMutation(({ password, query }) =>
		request(OpenAPI, {
			method: 'POST',
			url: '/api/users/change-password',
			query,
			body: { password },
			mediaType: 'application/json',
			errors: {
				400: 'Bad Request',
			},
		}),
	);

	return {
		requestReset: (email) => requestReset(email),
		changePassword: (vars) => changePassword(vars),
	};
}
