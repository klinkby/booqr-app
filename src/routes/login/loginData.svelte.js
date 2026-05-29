import { AuthenticationService } from '$lib/api';
import { usePublicMutation } from '$lib/resourceQuery.svelte.js';

/**
 * Route-local data hook for the login page. Wraps the login call in
 * `usePublicMutation` (no 401 refresh-and-retry, no cache invalidation) since
 * authentication is a pre-auth flow — a 401 here means bad credentials.
 */
export function useLoginData() {
	const login = usePublicMutation((credentials) => AuthenticationService.login(credentials));
	return {
		login: (credentials) => login(credentials),
	};
}
