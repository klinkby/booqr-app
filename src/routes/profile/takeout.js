/**
 * File name for a downloaded GDPR takeout document, e.g.
 * `booqr-takeout-acme-2026-11-07.json`. The date is the UTC calendar date of
 * `exportedAt` (taken from the ISO string, so it is timezone-independent).
 * Non-alphanumeric characters in the slug are replaced so the name is safe on
 * every file system.
 *
 * @param {{ tenantSlug?: string, exportedAt?: string }} doc
 * @returns {string}
 */
export function takeoutFileName(doc) {
	const slug = (doc?.tenantSlug ?? '').replace(/[^a-z0-9-]/gi, '-').replace(/^-+|-+$/g, '');
	const date = /^\d{4}-\d{2}-\d{2}/.exec(doc?.exportedAt ?? '')?.[0];
	return ['booqr-takeout', slug, date].filter(Boolean).join('-') + '.json';
}
