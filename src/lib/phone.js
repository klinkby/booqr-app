/**
 * Calling codes offered by PhoneInput: Nordics, Benelux, Germany, Poland, Baltics.
 * `region` is an ISO 3166 code used to localise the country name; `min`/`max` bound the
 * subscriber-number length (digits after the calling code, no trunk prefix).
 */
export const COUNTRIES = [
	{ region: 'DK', min: 8, max: 8, code: '45' },
	{ region: 'SE', min: 7, max: 10, code: '46' },
	{ region: 'NO', min: 8, max: 8, code: '47' },
	{ region: 'FI', min: 6, max: 10, code: '358' },
	{ region: 'IS', min: 7, max: 7, code: '354' },
	{ region: 'BE', min: 8, max: 9, code: '32' },
	{ region: 'NL', min: 9, max: 9, code: '31' },
	{ region: 'LU', min: 6, max: 9, code: '352' },
	{ region: 'DE', min: 7, max: 13, code: '49' },
	{ region: 'PL', min: 9, max: 9, code: '48' },
	{ region: 'EE', min: 7, max: 8, code: '372' },
	{ region: 'LV', min: 8, max: 8, code: '371' },
	{ region: 'LT', min: 8, max: 8, code: '370' },
];

export const DEFAULT_CODE = '45';

/**
 * Split the API's single numeric value (calling code + subscriber number) into its parts.
 * @param {string} value e.g. "4512345678"
 * @returns {{ code: string, national: string, matched: boolean }}
 */
export function decodePhone(value) {
	const digits = String(value ?? '');
	const match = COUNTRIES.find((c) => digits.startsWith(c.code));
	return match
		? { code: match.code, national: digits.slice(match.code.length), matched: true }
		: { code: DEFAULT_CODE, national: digits, matched: false };
}

/**
 * Join a calling code and subscriber number into the API's single numeric value.
 * An empty subscriber number yields an empty value.
 * @param {string} code
 * @param {string} national
 * @returns {string}
 */
export function encodePhone(code, national) {
	const digits = String(national ?? '').replace(/\D/g, '');
	return digits ? code + digits : '';
}

/**
 * HTML `pattern` for the subscriber number of a calling code.
 * @param {string} code
 * @returns {string}
 */
export function nationalPattern(code) {
	const { min, max } = COUNTRIES.find((c) => c.code === code) ?? { min: 6, max: 12 };
	return `[0-9]{${min},${max}}`;
}
