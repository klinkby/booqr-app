/**
 * Calling codes offered by PhoneInput: Nordics, Benelux, Germany, Poland, Baltics.
 * `region` is an ISO 3166 code used to localise the country name.
 */
export const COUNTRIES = [
	{ region: 'DK', code: '45' },
	{ region: 'SE', code: '46' },
	{ region: 'NO', code: '47' },
	{ region: 'FI', code: '358' },
	{ region: 'IS', code: '354' },
	{ region: 'BE', code: '32' },
	{ region: 'NL', code: '31' },
	{ region: 'LU', code: '352' },
	{ region: 'DE', code: '49' },
	{ region: 'PL', code: '48' },
	{ region: 'EE', code: '372' },
	{ region: 'LV', code: '371' },
	{ region: 'LT', code: '370' },
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
