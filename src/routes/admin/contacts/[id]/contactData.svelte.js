import { UserService } from '$lib/api';
import { queryKeys } from '$lib/queryKeys';
import { fetchResource, useResourceMutation } from '$lib/resourceQuery.svelte.js';

/**
 * Route-local data hook for the contact create/edit form.
 */
export function useContactData() {
	const saveContact = useResourceMutation(queryKeys.users.all, (variables) => {
		const { id, isEdit, payload } = variables;
		return isEdit ? UserService.updateUser(id, payload) : UserService.addUser(payload);
	});

	return {
		// Always-fresh detail fetch for edit mode.
		getContact: (id) => fetchResource(() => UserService.getUserById(id)),
		saveContact: (variables) => saveContact(variables),
	};
}
