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
}
