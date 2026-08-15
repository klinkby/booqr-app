/**
 * Shared Playwright API mocks for tests that don't hit a real backend.
 * Call setupApiMocks(page) in beforeEach for offline/unit-style tests.
 * Call setupAuthToken(page) to inject a fake Employee JWT via initScript.
 */

export const FAKE_TOKEN =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
	'.eyJzdWIiOiIxIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZSI6IkVtcGxveWVlIiwibmJmIjoxNzcwNDc1NjgwLCJleHAiOjI3NzA0NzkyODAsImlhdCI6MTc3MDQ3NTY4MCwiaXNzIjoiYm9vcXIiLCJhdWQiOiJodHRwczovL3d3dy5ib29xci5kayJ9' +
	'.fake';

export const LOCATIONS = [
	{ id: 1, name: 'Location A', address1: '1 Main Street', city: 'Springfield' },
	{ id: 2, name: 'Location B', address1: '2 Side Street', city: 'Springfield' },
];

export const EMPLOYEES = [
	{ id: 'emp1', name: 'Employee One', email: 'emp1@example.com', role: 'Employee' },
	{ id: 'emp2', name: 'Employee Two', email: 'emp2@example.com', role: 'Employee' },
];

// Single-employee service: the customer booking wizard's "With whom?" step
// (step 3) is skipped by default, while "Where?" (step 2) still shows since
// LOCATIONS above has more than one entry — exercising both the shown and
// skipped variants of the same skip-logic in the same default mock setup.
export const SERVICES = [
	{ id: 'svc1', name: 'Haircut', duration: '00:30:00', description: 'A classic haircut.', employees: ['emp1'] },
];

/** Returns ISO strings for vacancies that fall in the current calendar week. */
function currentWeekVacancies() {
	const today = new Date();
	const day = today.getDay(); // 0=Sun … 6=Sat
	const daysFromMonday = day === 0 ? 6 : day - 1;

	const monday = new Date(today);
	monday.setDate(today.getDate() - daysFromMonday);

	// Use local setHours so DateUtils.utcToLocalIso round-trips to the same time
	function makeTime(daysOffset, hours) {
		const d = new Date(monday);
		d.setDate(monday.getDate() + daysOffset);
		d.setHours(hours, 0, 0, 0);
		return d.toISOString();
	}

	return [
		{
			id: '1',
			startTime: makeTime(1, 10),
			endTime: makeTime(1, 11),
			employeeId: 'emp1',
			locationId: 1,
			bookingId: null,
		},
		{
			id: '2',
			startTime: makeTime(2, 14),
			endTime: makeTime(2, 15),
			employeeId: 'emp2',
			locationId: 2,
			bookingId: 'booking123',
		},
	];
}

/**
 * Registers route mocks for all API endpoints used by the app's layout and
 * admin calendar page. Safe to call multiple times; later registrations win.
 */
export async function setupApiMocks(page) {
	await page.route('**/api/vacancies*', (route) =>
		route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ items: currentWeekVacancies() }),
		}),
	);
	await page.route('**/api/locations*', (route) =>
		route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: LOCATIONS }) }),
	);
	await page.route('**/api/services*', (route) =>
		route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: SERVICES }) }),
	);
	await page.route('**/api/employees*', (route) =>
		route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: EMPLOYEES }) }),
	);
	await page.route('**/api/users/*/my-bookings*', (route) =>
		route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [] }) }),
	);
	// Method-aware: GET lists users (e.g. the admin roster); POST is the
	// customer sign-up call (`UserService.addUser`) and must not silently 200
	// off the GET fallback, or the sign-up e2e test would prove nothing.
	await page.route('**/api/users*', (route) => {
		const request = route.request();
		if (request.method() === 'POST') {
			return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 'newUser1' }) });
		}
		return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: EMPLOYEES }) });
	});
}

/**
 * Injects a fake Employee JWT into sessionStorage before the page loads,
 * bypassing the login flow for tests that need an authenticated session.
 */
export async function setupAuthToken(page) {
	await page.addInitScript((token) => {
		sessionStorage.setItem('access_token', token);
	}, FAKE_TOKEN);
}
