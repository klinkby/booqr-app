export class DateUtils {
	static #pad(n) {
		return String(n).padStart(2, '0');
	}

	static toLocalDate(d) {
		return `${d.getFullYear()}-${DateUtils.#pad(d.getMonth() + 1)}-${DateUtils.#pad(d.getDate())}`;
	}

	static toLocalTime(d) {
		return `${DateUtils.#pad(d.getHours())}:${DateUtils.#pad(d.getMinutes())}`;
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
		if (hours === 0) return `${minutes} min`;
		if (minutes === 0) return `${hours} h`;
		return `${hours} h ${minutes} min`;
	}
}
