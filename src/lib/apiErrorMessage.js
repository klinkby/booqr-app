import { ApiError } from '#lib/api/core/ApiError.js';
import { m } from '#lib/paraglide/messages.js';

/**
 * Extracts a human-readable error message from an API error.
 * For ProblemDetails responses: uses field validation messages from `errors`,
 * falls back to `title`. If neither is available, returns `fallback`.
 *
 * @param {unknown} err
 * @param {string} [fallback]
 * @returns {string}
 */
export function apiErrorMessage(err, fallback = m.errorDefault()) {
	if (err instanceof ApiError && err.body) {
		const messages = err.body.errors && Object.values(err.body.errors).flat();
		if (messages?.length > 0) return messages.join(' ');
		if (err.body.title) return err.body.title;
	}
	return fallback;
}

/**
 * Returns the ProblemDetails `type` URI of an API error when it is a linkable
 * absolute https URL, else null. Rejects `about:blank`, relative URIs and other
 * schemes (e.g. `javascript:`), so the result is safe to use as an `href`.
 *
 * @param {unknown} err
 * @returns {string | null}
 */
export function apiErrorHelpUrl(err) {
	const type = err instanceof ApiError ? err.body?.type : undefined;
	if (typeof type !== 'string' || !URL.canParse(type)) return null;
	return new URL(type).protocol === 'https:' ? type : null;
}

/**
 * Message plus optional ProblemDetails help link, for `ErrorMessage` and `Form`'s `error` prop.
 *
 * @param {unknown} err
 * @param {string} [fallback]
 * @returns {{ message: string, helpUrl: string | null }}
 */
export function apiError(err, fallback) {
	return { message: apiErrorMessage(err, fallback), helpUrl: apiErrorHelpUrl(err) };
}
