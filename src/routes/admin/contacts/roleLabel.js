import { m } from '#lib/paraglide/messages.js';

/**
 * Translated label for an API role value.
 * @param {string} value 'Customer' | 'Employee' | 'Admin'
 * @returns {string}
 */
export function roleLabel(value) {
	if (value === 'Employee') return m.employee();
	if (value === 'Admin') return m.roleAdmin();
	return m.customer();
}
