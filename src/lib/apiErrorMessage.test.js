import { describe, expect, it, vi } from 'vitest';
import { ApiError } from './api/core/ApiError';

vi.mock('$lib/paraglide/messages.js', () => ({
	m: { errorDefault: () => 'default-error' },
}));

const { apiErrorMessage } = await import('./apiErrorMessage.js');

/** Build an ApiError with a given ProblemDetails-ish body. */
const makeError = (body) =>
	new ApiError(
		{ method: 'GET', url: '/x' },
		{ url: '/x', status: 400, statusText: 'Bad Request', ok: false, body },
		'boom',
	);

describe('apiErrorMessage', () => {
	it('falls back to the default message for non-ApiError input', () => {
		expect(apiErrorMessage(new Error('plain'))).toBe('default-error');
		expect(apiErrorMessage(null)).toBe('default-error');
	});

	it('uses the caller-supplied fallback when given', () => {
		expect(apiErrorMessage(new Error('plain'), 'custom')).toBe('custom');
	});

	it('joins flattened field-validation messages from body.errors', () => {
		const err = makeError({ errors: { email: ['Invalid email.'], password: ['Too short.', 'Required.'] } });
		expect(apiErrorMessage(err)).toBe('Invalid email. Too short. Required.');
	});

	it('falls back to body.title when there are no field errors', () => {
		const err = makeError({ title: 'One or more validation errors occurred.' });
		expect(apiErrorMessage(err)).toBe('One or more validation errors occurred.');
	});

	it('prefers field errors over title when both are present', () => {
		const err = makeError({ errors: { name: ['Required.'] }, title: 'Validation failed' });
		expect(apiErrorMessage(err)).toBe('Required.');
	});

	it('falls back to the default when an ApiError has no usable body', () => {
		const err = makeError(undefined);
		expect(apiErrorMessage(err)).toBe('default-error');
	});

	it('falls back to the default when body.errors is empty', () => {
		const err = makeError({ errors: {} });
		expect(apiErrorMessage(err)).toBe('default-error');
	});
});
