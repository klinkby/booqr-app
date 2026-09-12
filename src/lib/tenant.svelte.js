import { browser } from '$app/environment';

/**
 * The apex/reserved hosts that carry no tenant and serve the marketing /
 * onboarding site rather than the booking app. Tenant validity is otherwise
 * decided ONLY by GET /api/my-tenant — never assume a subdomain is valid
 * client-side (see docs/1-design.md security notes).
 */
const BASE_DOMAIN = 'booqr.dk';
const RESERVED_HOSTS = new Set([BASE_DOMAIN, `www.${BASE_DOMAIN}`, `status.${BASE_DOMAIN}`]);

/**
 * Categorise a hostname without contacting the API.
 * - `reserved` → apex/www/status: render the marketing view, no tenant fetch.
 * - `tenant`   → everything else (a real `<slug>.booqr.dk`, plus localhost /
 *   dev / preview hosts): a tenant candidate whose validity is confirmed by
 *   the API response.
 * @param {string} hostname
 * @returns {'reserved' | 'tenant'}
 */
export function hostCategory(hostname) {
	return RESERVED_HOSTS.has(hostname) ? 'reserved' : 'tenant';
}

/**
 * Runes-based tenant state singleton, mirroring `auth.svelte.js`. Holds the
 * public branding returned by GET /api/my-tenant (`{ displayName, slug }` —
 * the backend exposes no id or logo) plus a resolution status. The actual
 * fetch is driven from the root layout bootstrap, not this module.
 *
 * status:
 * - `loading`  → initial; resolution in progress.
 * - `resolved` → a known tenant; `displayName`/`slug` populated.
 * - `notFound` → unknown/deleted/malformed subdomain (API 404); layout redirects.
 * - `reserved` → apex/www/status host; render marketing, no tenant.
 */
class TenantState {
	#displayName = $state(null);
	#slug = $state(null);
	#status = $state('loading');

	get displayName() {
		return this.#displayName;
	}

	get slug() {
		return this.#slug;
	}

	get status() {
		return this.#status;
	}

	isResolved = $derived(this.#status === 'resolved');
	isLoading = $derived(this.#status === 'loading');
	isNotFound = $derived(this.#status === 'notFound');
	isReserved = $derived(this.#status === 'reserved');

	/** Populate from a successful GET /api/my-tenant response. */
	resolve({ displayName, slug } = {}) {
		this.#displayName = displayName ?? null;
		this.#slug = slug ?? null;
		this.#status = 'resolved';
	}

	/** Mark the host as an unknown/absent tenant (API 404). */
	setNotFound() {
		this.#displayName = null;
		this.#slug = null;
		this.#status = 'notFound';
	}

	/** Mark the host as a reserved/apex host serving the marketing view. */
	setReserved() {
		this.#displayName = null;
		this.#slug = null;
		this.#status = 'reserved';
	}
}

export const tenant = new TenantState();

// Bootstrap the reserved/marketing category synchronously at module init so the
// layout never flashes the tenant app shell on an apex host. The API-backed
// resolution for tenant candidates is driven from the layout `$effect`.
if (browser && hostCategory(window.location.hostname) === 'reserved') {
	tenant.setReserved();
}
