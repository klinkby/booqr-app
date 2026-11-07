/** Entity lists every takeout document carries, in display order. */
export const TAKEOUT_ENTITIES = ['users', 'locations', 'services', 'bookings', 'calendar'];

/**
 * File name for a downloaded takeout document (personal GDPR export or
 * organization backup), e.g. `booqr-takeout-acme-2026-11-07.json`. The date is
 * the UTC calendar date of `exportedAt` (taken from the ISO string, so it is
 * timezone-independent). Non-alphanumeric characters in the slug are replaced
 * so the name is safe on every file system.
 *
 * @param {{ tenantSlug?: string, exportedAt?: string }} doc
 * @returns {string}
 */
export function takeoutFileName(doc) {
	const slug = (doc?.tenantSlug ?? '').replace(/[^a-z0-9-]/gi, '-').replace(/^-+|-+$/g, '');
	const date = /^\d{4}-\d{2}-\d{2}/.exec(doc?.exportedAt ?? '')?.[0];
	return ['booqr-takeout', slug, date].filter(Boolean).join('-') + '.json';
}

/**
 * Parse the text of a chosen backup file. Returns the takeout document, or
 * `null` when the text isn't JSON or lacks the document's entity lists. This
 * is a cheap client-side shape check only — the API's dry run is
 * authoritative.
 *
 * @param {string} text
 * @returns {object | null}
 */
export function parseTakeoutFile(text) {
	let doc;
	try {
		doc = JSON.parse(text);
	} catch {
		return null;
	}
	if (!doc || typeof doc !== 'object' || Array.isArray(doc)) return null;
	return TAKEOUT_ENTITIES.every((key) => Array.isArray(doc[key])) ? doc : null;
}

/**
 * One row per entity of an import (dry-run) response, for the summary table.
 * Missing counts read as 0.
 *
 * @param {object} response ImportTakeoutResponse
 * @returns {Array<{ key: string, created: number, matched: number, skipped: number }>}
 */
export function importSummaryRows(response) {
	return TAKEOUT_ENTITIES.map((key) => {
		const counts = response?.[key] ?? {};
		return {
			key,
			created: Number(counts.created ?? 0),
			matched: Number(counts.matched ?? 0),
			skipped: Number(counts.skipped ?? 0),
		};
	});
}
