import { m } from '#lib/paraglide/messages.js';

export class DateUtils {
	static #pad(n) {
		return String(n).padStart(2, '0');
	}

	static toLocalDate(d) {
		return `${d.getFullYear()}-${DateUtils.#pad(d.getMonth() + 1)}-${DateUtils.#pad(d.getDate())}`;
	}

	/**
	 * Parses a `YYYY-MM-DD` string as local midnight. Returns `null` unless the
	 * date really exists — `new Date('2026-02-31T00:00')` silently rolls over
	 * to 3 March, so the result must round-trip back to the input.
	 *
	 * @param {string | null | undefined} value
	 * @returns {Date | null}
	 */
	static parseLocalDate(value) {
		if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
		const d = new Date(`${value}T00:00`);
		return DateUtils.toLocalDate(d) === value ? d : null;
	}

	/** "10. December" — the day format used across the booking flow. */
	static formatDayMonth(d, locale) {
		return `${d.getDate()}. ${d.toLocaleDateString(locale, { month: 'long' })}`;
	}

	/** "Wednesday, November 25, 2026" from a local `YYYY-MM-DD`; '' when empty. Side-panel date line. */
	static formatLongDate(date, locale) {
		if (!date) return '';
		return new Date(date + 'T00:00').toLocaleDateString(locale, {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	}

	static toLocalTime(d) {
		return `${DateUtils.#pad(d.getHours())}:${DateUtils.#pad(d.getMinutes())}`;
	}

	/** The current instant as a UTC ISO string, e.g. for an API `FromTime` of "now". */
	static nowUtcIso() {
		return new Date().toISOString();
	}

	static utcToLocalIso(utcString) {
		const d = new Date(utcString);
		return `${DateUtils.toLocalDate(d)}T${DateUtils.toLocalTime(d)}`;
	}

	/**
	 * Parses an API duration string ("HH:MM:SS", seconds included — live data
	 * uses values like "01:10:10") into total whole seconds. Used wherever the
	 * duration feeds into slot arithmetic, where dropping seconds would let a
	 * service's true length undershoot the grid.
	 *
	 * @param {string | null | undefined} duration
	 * @returns {number}
	 */
	static parseDurationSeconds(duration) {
		if (!duration) return 0;
		const parts = duration.split(':').map(Number);
		if (parts.some((n) => Number.isNaN(n))) return 0;
		const [hours = 0, minutes = 0, seconds = 0] = parts;
		return hours * 3600 + minutes * 60 + seconds;
	}

	/**
	 * Formats a duration for display in hours and minutes only — never
	 * seconds, per the wizard spec ("30 min", "1 h 10 min").
	 *
	 * @param {string | null | undefined} duration
	 * @returns {string}
	 */
	static formatDuration(duration) {
		const totalMinutes = Math.round(DateUtils.parseDurationSeconds(duration) / 60);
		const hours = Math.floor(totalMinutes / 60);
		const minutes = totalMinutes % 60;
		if (hours === 0) return m.durationMinutes({ minutes });
		if (minutes === 0) return m.durationHours({ hours });
		return m.durationHoursMinutes({ hours, minutes });
	}

	/**
	 * Formats an API duration (`HH:MM:SS`) as `H:mm`, rounding to whole minutes.
	 *
	 * @param {string | null | undefined} duration
	 * @returns {string} e.g. `0:30`, `1:10`
	 */
	static formatHmm(duration) {
		const totalMinutes = Math.round(DateUtils.parseDurationSeconds(duration) / 60);
		return `${Math.floor(totalMinutes / 60)}:${String(totalMinutes % 60).padStart(2, '0')}`;
	}

	/**
	 * Converts `H:mm` input to the API's `HH:MM:SS` duration.
	 *
	 * @param {string} hmm e.g. `1:10`
	 * @returns {string} e.g. `01:10:00`
	 */
	static hmmToDuration(hmm) {
		const [hours = '0', minutes = '0'] = hmm.trim().split(':');
		return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
	}
}
