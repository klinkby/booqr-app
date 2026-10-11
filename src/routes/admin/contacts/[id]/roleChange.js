/** Roles an admin can assign, in ascending order of privilege. */
export const ROLES = ['Customer', 'Employee', 'Admin'];

/**
 * Whether the signed-in viewer may change the role of the contact being edited.
 * Only admins can, and never their own role (the API also refuses it with 403).
 *
 * @param {string | null} viewerRole
 * @param {string | number | null} viewerUserId
 * @param {string} contactId
 * @returns {boolean}
 */
export function canChangeRole(viewerRole, viewerUserId, contactId) {
	if (viewerRole !== 'Admin') return false;
	if (viewerUserId == null) return false;
	if (contactId === 'new') return false;
	return String(viewerUserId) !== String(contactId);
}
