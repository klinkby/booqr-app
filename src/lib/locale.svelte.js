/**
 * Lightweight locale state using Svelte 5 runes.
 *
 * Defaults to the browser's preferred language (Danish or English).
 * An explicit override is stored in localStorage and wins until cleared.
 * Updating the locale also sets `document.documentElement.lang`.
 */

const STORAGE_KEY = 'locale-override';
const SUPPORTED = /** @type {const} */ (['da', 'en']);
const DEFAULT_LOCALE = 'en';

/**
 * Return the best-matching supported locale from the browser's
 * language preferences, or the default if none match.
 * @returns {'da' | 'en'}
 */
function detectBrowserLocale() {
	if (typeof navigator === 'undefined') return DEFAULT_LOCALE;

	for (const tag of navigator.languages ?? [navigator.language]) {
		const primary = tag.split('-')[0].toLowerCase();
		if (SUPPORTED.includes(/** @type {any} */ (primary))) {
			return /** @type {'da' | 'en'} */ (primary);
		}
	}
	return DEFAULT_LOCALE;
}

/**
 * Read a previously stored override, if any.
 * @returns {'da' | 'en' | null}
 */
function readOverride() {
	try {
		const v = localStorage.getItem(STORAGE_KEY);
		return SUPPORTED.includes(/** @type {any} */ (v)) ? /** @type {'da' | 'en'} */ (v) : null;
	} catch {
		return null;
	}
}

/**
 * Persist (or clear) the override.
 * @param {'da' | 'en' | null} value
 */
function writeOverride(value) {
	try {
		if (value === null) {
			localStorage.removeItem(STORAGE_KEY);
		} else {
			localStorage.setItem(STORAGE_KEY, value);
		}
	} catch {
		// localStorage unavailable — silent fallback
	}
}

function createLocaleState() {
	const browserLocale = detectBrowserLocale();
	const initialOverride = readOverride();

	let override = $state(initialOverride);
	let current = $derived(override ?? browserLocale);

	$effect(() => {
		document.documentElement.lang = current;
	});

	return {
		/** The active locale: override if set, otherwise the browser default. */
		get current() {
			return current;
		},

		/** Whether the user has explicitly overridden the browser default. */
		get isOverridden() {
			return override !== null;
		},

		/** The locale the toggle would switch to. */
		get alternate() {
			return current === 'da' ? 'en' : 'da';
		},

		/** Toggle to the alternate locale and persist the choice. */
		toggle() {
			const next = current === 'da' ? 'en' : 'da';
			override = next;
			writeOverride(next);
		},

		/** Clear the override so the browser default takes effect again. */
		clearOverride() {
			override = null;
			writeOverride(null);
		},
	};
}

export const locale = createLocaleState();
