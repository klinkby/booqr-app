import { UserService } from '#lib/api/index.js';
import { queryKeys } from '#lib/queryKeys.js';
import { fetchResource, useResourceMutation } from '#lib/resourceQuery.svelte.js';

/**
 * Route-local data hook for the contact create/edit form.
 */
export function useContactData() {
	const saveContact = useResourceMutation(queryKeys.users.all, (variables) => {
		const { id, isEdit, payload } = variables;
		if (isEdit) return UserService.updateUser(id, payload);
		// POST /api/users only accepts the email; name and phone follow in a PUT.
		const { email, name, phone } = payload;
		return UserService.addUser({ email }).then((created) => UserService.updateUser(created.id, { name, phone }));
	});

	const changeRole = useResourceMutation(queryKeys.users.all, ({ id, role }) =>
		UserService.changeUserRole(id, { role }),
	);

	return {
		// Always-fresh detail fetch for edit mode.
		getContact: (id) => fetchResource(() => UserService.getUserById(id)),
		saveContact: (variables) => saveContact(variables),
		changeRole: (variables) => changeRole(variables),
	};
}
