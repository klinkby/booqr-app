import { UserService } from '$lib/api';
import { auth } from '$lib/auth.svelte.js';
import { queryKeys } from '$lib/queryKeys';
import { fetchResource, useResourceMutation } from '$lib/resourceQuery.svelte.js';

/**
 * Route-local data hook for the profile edit page. Fetches the current
 * user's profile via a one-off fetchResource (always fresh) and exposes a
 * mutation that invalidates the profile key on success.
 */
export function useProfileData() {
	const saveProfile = useResourceMutation(queryKeys.profile.detail(auth.userId), (payload) =>
		UserService.updateUser(auth.userId, payload),
	);

	return {
		// Always-fresh fetch — called once in onMount rather than as a reactive
		// query because profile edits should not reactively refresh mid-form.
		getProfile: () => fetchResource(() => UserService.getUserById(auth.userId)),
		saveProfile: (payload) => saveProfile(payload),
	};
}
