import { ApiError } from '#lib/api/core/ApiError.js';
import { m } from '#lib/paraglide/messages.js';

/**
 * Extracts a human-readable error message from an API error.
 * For ProblemDetails responses: uses field validation messages from `errors`,
 * falls back to `title`, then `detail`. If none is available, returns `fallback`.
 *
 * @param {unknown} err
 * @param {string} [fallback]
 * @returns {string}
 */
export function apiErrorMessage(err, fallback = m.errorDefault()) {
	if (err instanceof ApiError && err.body) {
		const messages = fieldMessages(err.body);
		if (messages.length > 0) return messages.join(' ');
		if (err.body.title) return err.body.title;
		if (err.body.detail) return err.body.detail;
	}
	return fallback;
}

/**
 * Returns the ProblemDetails `detail` to show under the `title`, or null. Null when field
 * validation `errors` are the message (the detail is then generic), when there is no title
 * (`apiErrorMessage` already shows the detail) or when it just repeats the title.
 *
 * @param {unknown} err
 * @returns {string | null}
 */
export function apiErrorDetail(err) {
	if (!(err instanceof ApiError) || !err.body) return null;
	const { title, detail } = err.body;
	if (fieldMessages(err.body).length > 0 || !title || !detail || detail === title) return null;
	return detail;
}

/** @param {{ errors?: Record<string, string[]> }} body */
const fieldMessages = (body) => (body.errors ? Object.values(body.errors).flat() : []);

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
 * Message plus optional ProblemDetails detail and help link, for `ErrorMessage` and `Form`'s
 * `error` prop. When swapping in custom copy, also drop the server detail:
 * `{ ...apiError(err), message: m.x(), detail: null }`.
 *
 * @param {unknown} err
 * @param {string} [fallback]
 * @returns {{ message: string, detail: string | null, helpUrl: string | null }}
 */
export function apiError(err, fallback) {
	return { message: apiErrorMessage(err, fallback), detail: apiErrorDetail(err), helpUrl: apiErrorHelpUrl(err) };
}
