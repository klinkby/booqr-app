/**
 * Locale picker state backed by Paraglide.
 *
 * Defaults to the browser's preferred language (Danish or English).
 * An explicit override is persisted by Paraglide and wins until cleared.
 */

import { browser } from '$app/environment';
import { getLocale, localStorageKey, setLocale } from '$lib/paraglide/runtime.js';

const LEGACY_STORAGE_KEY = 'locale-override';
const SUPPORTED = /** @type {const} */ (['da', 'en']);
const DEFAULT_LOCALE = 'en';

/**
 * Move the override written by the original language toggle to
 * Paraglide's configured storage key.
 * @returns {'da' | 'en'}
 */
function migrateLegacyOverride() {
	if (!browser) return DEFAULT_LOCALE;

	try {
		const legacyLocale = localStorage.getItem(LEGACY_STORAGE_KEY);
		if (localStorage.getItem(localStorageKey) === null && SUPPORTED.includes(/** @type {any} */ (legacyLocale))) {
			localStorage.setItem(localStorageKey, legacyLocale);
		}
		localStorage.removeItem(LEGACY_STORAGE_KEY);
	} catch {
		// localStorage unavailable — use Paraglide's preferred-language fallback
	}

	return activeLocale();
}

/**
 * Return the active supported locale.
 * @returns {'da' | 'en'}
 */
function activeLocale() {
	const active = getLocale();
	return SUPPORTED.includes(/** @type {any} */ (active)) ? /** @type {'da' | 'en'} */ (active) : DEFAULT_LOCALE;
}

migrateLegacyOverride();

export const locale = {
	/** The active locale: override if set, otherwise the browser default. */
	get current() {
		return activeLocale();
	},

	/** Whether the user has explicitly overridden the browser default. */
	get isOverridden() {
		if (!browser) return false;
		try {
			return localStorage.getItem(localStorageKey) !== null;
		} catch {
			return false;
		}
	},

	/** The locale the toggle would switch to. */
	get alternate() {
		return activeLocale() === 'da' ? 'en' : 'da';
	},

	/** Persist the alternate locale, then reload so all translated content updates. */
	toggle() {
		setLocale(activeLocale() === 'da' ? 'en' : 'da');
	},

	/** Clear the override and reload with the browser's preferred locale. */
	clearOverride() {
		if (!browser) return;
		try {
			localStorage.removeItem(localStorageKey);
		} catch {
			return;
		}
		window.location.reload();
	},
};
