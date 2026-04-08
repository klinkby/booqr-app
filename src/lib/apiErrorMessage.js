import { ApiError } from '$lib/api/core/ApiError';

/**
 * Extracts a human-readable error message from an API error.
 * For ProblemDetails responses: uses field validation messages from `errors`,
 * falls back to `title`. If neither is available, returns a generic connection error.
 *
 * @param {unknown} err
 * @returns {string}
 */
export function apiErrorMessage(err) {
	if (err instanceof ApiError && err.body) {
		const messages = err.body.errors && Object.values(err.body.errors).flat();
		if (messages?.length > 0) return messages.join(' ');
		if (err.body.title) return err.body.title;
	}
	return 'Unable to connect to the server. Please try again later.';
}
