import { expect, test } from '@playwright/test';
import { EMPLOYEES, FAKE_TOKEN, LOCATIONS, setupApiMocks } from './mocks.js';

/** A day comfortably in the future, plus how many "Next month" clicks the month grid needs to reach it. */
function pickTargetDay() {
	const today = new Date();
	const target = new Date(today);
	target.setDate(today.getDate() + 20);
	target.setHours(9, 0, 0, 0);
	const monthDiff = target.getFullYear() * 12 + target.getMonth() - (today.getFullYear() * 12 + today.getMonth());
	return { target, monthDiff };
}

/** Registers a single bookable vacancy on `target` (09:00-10:00 local) plus its detail-by-id route. */
async function mockSingleVacancy(page, target, { id = 'e2e-slot-1', employeeId = 'emp1', locationId = 1 } = {}) {
	const startTime = new Date(target);
	startTime.setHours(9, 0, 0, 0);
	const endTime = new Date(target);
	endTime.setHours(10, 0, 0, 0);
	const vacancy = {
		id,
		startTime: startTime.toISOString(),
		endTime: endTime.toISOString(),
		employeeId,
		locationId,
		bookingId: null,
	};

	// Two distinct glob patterns, not one: Playwright's `*` doesn't cross `/`,
	// so a single `**/api/vacancies*` pattern never matches the detail URL
	// `/api/vacancies/e2e-slot-1` (there's a `/` right after "vacancies").
	await page.route('**/api/vacancies*', (route) =>
		route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [vacancy] }) }),
	);
	await page.route('**/api/vacancies/*', (route) =>
		route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(vacancy) }),
	);

	return vacancy;
}

async function advanceToMonth(page, monthDiff) {
	for (let i = 0; i < monthDiff; i++) {
		await page.getByRole('button', { name: 'Next ›' }).click();
	}
}

/** Two bookable vacancies far enough apart (35 days) to always land in different months. */
async function mockTwoScatteredVacancies(page) {
	const today = new Date();
	const near = new Date(today);
	near.setDate(today.getDate() + 5);
	near.setHours(9, 0, 0, 0);
	const far = new Date(today);
	far.setDate(today.getDate() + 40);
	far.setHours(9, 0, 0, 0);

	function toVacancy(id, day) {
		const startTime = new Date(day);
		const endTime = new Date(day);
		endTime.setHours(endTime.getHours() + 1);
		return {
			id,
			startTime: startTime.toISOString(),
			endTime: endTime.toISOString(),
			employeeId: 'emp1',
			locationId: 1,
			bookingId: null,
		};
	}
	const items = [toVacancy('e2e-near', near), toVacancy('e2e-far', far)];

	await page.route('**/api/vacancies*', (route) =>
		route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items }) }),
	);

	return { near, far };
}

test.describe('Customer booking flow', () => {
	test.beforeEach(async ({ page, context }) => {
		await setupApiMocks(page);
		await context.clearCookies();
	});

	test('home page lists services with formatted duration', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('h1')).toHaveText('Select a service');
		const serviceButton = page.getByRole('button', { name: /Haircut/ });
		await expect(serviceButton).toBeVisible();
		await expect(serviceButton).toContainText('30 min');
	});

	test('full funnel: service → location → day → time → auth gate', async ({ page }) => {
		const { target, monthDiff } = pickTargetDay();
		await mockSingleVacancy(page, target);

		await page.goto('/');
		await page.getByRole('button', { name: /Haircut/ }).click();

		// Step 2: "Where?" — two locations configured, so this step is shown.
		await expect(page.locator('h1')).toHaveText('Where?');
		await page.getByRole('button', { name: 'Location A' }).click();

		// Step 3 ("With whom?") is skipped — the service has one employee.
		// Step 4: month grid.
		await expect(page.locator('h1')).not.toHaveText('With whom?');
		await advanceToMonth(page, monthDiff);
		const dayOfMonth = String(target.getDate());
		await page.getByRole('button', { name: dayOfMonth, exact: true }).click();

		// Step 5: time list.
		await expect(page.getByRole('button', { name: /09:00/ })).toBeVisible();
		await page.getByRole('button', { name: /09:00/ }).click();

		// Step 6: inline auth gate (not signed in).
		await expect(page.locator('h1')).toHaveText('Sign in or sign up');
		await expect(page.getByText('This time is not held')).toBeVisible();
	});

	test('single location and employee skips straight to the month grid', async ({ page }) => {
		// Override to a single location so step 2 is also auto-skipped.
		await page.route('**/api/locations*', (route) =>
			route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [LOCATIONS[0]] }) }),
		);

		await page.goto('/');
		await page.getByRole('button', { name: /Haircut/ }).click();

		await expect(page.locator('h1')).not.toHaveText('Where?');
		await expect(page.locator('h1')).not.toHaveText('With whom?');
		// What's left is the month grid — its heading is the current month name.
		const monthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
		await expect(page.locator('h1')).toHaveText(monthLabel);
	});

	test('sign-up shows the activation message and never reveals whether the email exists', async ({ page }) => {
		const { target, monthDiff } = pickTargetDay();
		await mockSingleVacancy(page, target);

		await page.goto('/');
		await page.getByRole('button', { name: /Haircut/ }).click();
		await page.getByRole('button', { name: 'Location A' }).click();
		await advanceToMonth(page, monthDiff);
		await page.getByRole('button', { name: String(target.getDate()), exact: true }).click();
		await page.getByRole('button', { name: /09:00/ }).click();

		await page.getByRole('button', { name: 'Create an account' }).click();
		await page.fill('#signupEmail', 'new-customer@example.com');
		await page.check('#acceptTerms');
		await page.getByRole('button', { name: 'Sign up' }).click();

		await expect(page.getByText("We've sent an activation link to new-customer@example.com")).toBeVisible();
	});

	test('signed-in customer completes a booking and reaches the thank-you page', async ({ page }) => {
		const { target, monthDiff } = pickTargetDay();
		await mockSingleVacancy(page, target);

		await page.route('**/api/bookings', (route) => {
			if (route.request().method() !== 'POST') return route.fallback();
			return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 'booking1' }) });
		});
		await page.route('**/api/auth/login', (route) =>
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ access_token: FAKE_TOKEN }),
			}),
		);

		await page.goto('/');
		await page.getByRole('button', { name: /Haircut/ }).click();
		await page.getByRole('button', { name: 'Location A' }).click();
		await advanceToMonth(page, monthDiff);
		await page.getByRole('button', { name: String(target.getDate()), exact: true }).click();
		await page.getByRole('button', { name: /09:00/ }).click();

		await page.fill('#email', process.env.TEST_EMAIL ?? 'test@example.com');
		await page.fill('#password', process.env.TEST_PASSWORD ?? 'TestPassword1!');
		await page.getByRole('button', { name: 'Sign in' }).click();

		await expect(page.locator('h1')).toHaveText('Confirm appointment');
		await expect(page.getByText(EMPLOYEES[0].name)).toBeVisible();
		await page.check('#acceptCancellation');
		await page.getByRole('button', { name: 'Book now' }).click();

		await expect(page).toHaveURL(/\/book\/done/);
		await expect(page.locator('h1')).toHaveText('Thank you for booking');
		await expect(
			page.getByText(`Your appointment with ${EMPLOYEES[0].name} at ${LOCATIONS[0].name} is confirmed.`),
		).toBeVisible();
	});

	test('a slot taken between selection and submit lands on the conflict page', async ({ page }) => {
		const { target, monthDiff } = pickTargetDay();
		await mockSingleVacancy(page, target);

		await page.route('**/api/bookings', (route) => {
			if (route.request().method() !== 'POST') return route.fallback();
			return route.fulfill({
				status: 409,
				contentType: 'application/problem+json',
				body: JSON.stringify({ title: 'Conflict' }),
			});
		});
		await page.route('**/api/auth/login', (route) =>
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ access_token: FAKE_TOKEN }),
			}),
		);

		await page.goto('/');
		await page.getByRole('button', { name: /Haircut/ }).click();
		await page.getByRole('button', { name: 'Location A' }).click();
		await advanceToMonth(page, monthDiff);
		await page.getByRole('button', { name: String(target.getDate()), exact: true }).click();
		await page.getByRole('button', { name: /09:00/ }).click();

		await page.fill('#email', process.env.TEST_EMAIL ?? 'test@example.com');
		await page.fill('#password', process.env.TEST_PASSWORD ?? 'TestPassword1!');
		await page.getByRole('button', { name: 'Sign in' }).click();
		await page.check('#acceptCancellation');
		await page.getByRole('button', { name: 'Book now' }).click();

		await expect(page).toHaveURL(/\/book\/[^/]+\/conflict\?date=/);
		await expect(page.locator('h1')).toHaveText('That time was just taken');
		await expect(page.getByRole('link', { name: 'Choose another time that day' })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Choose a different day' })).toBeVisible();
	});

	test('Prev/Next on the time step jump to the nearest available day, crossing months', async ({ page }) => {
		const { near, far } = await mockTwoScatteredVacancies(page);
		const nearMonthLabel = near.toLocaleDateString('en-US', { month: 'long' });
		const farMonthLabel = far.toLocaleDateString('en-US', { month: 'long' });

		await page.goto(
			`/book/svc1?date=${near.getFullYear()}-${String(near.getMonth() + 1).padStart(2, '0')}-${String(near.getDate()).padStart(2, '0')}`,
		);
		await page.getByRole('button', { name: 'Location A' }).click();

		await expect(page.getByRole('button', { name: /09:00/ })).toBeVisible();

		// The time step's Prev/Next set `aria-label` to the target-date hover
		// text, which overrides "‹ Prev"/"Next ›" as the accessible name — so
		// these must be selected by that label, not the visible glyph text.
		const nextButton = page.getByRole('button', { name: /Next available/ });
		await expect(nextButton).toBeEnabled();
		await expect(nextButton).toHaveAttribute(
			'aria-label',
			new RegExp(`Next available: ${far.getDate()} ${farMonthLabel}`),
		);
		await nextButton.click();

		// Landed directly on the far day — not the adjacent calendar day —
		// crossing a month boundary in the process.
		await expect(page.locator('h1')).toContainText(farMonthLabel);
		await expect(page.getByRole('button', { name: /09:00/ })).toBeVisible();

		const prevButton = page.getByRole('button', { name: /Previous available/ });
		await expect(prevButton).toBeEnabled();
		await expect(prevButton).toHaveAttribute(
			'aria-label',
			new RegExp(`Previous available: ${near.getDate()} ${nearMonthLabel}`),
		);
	});
});
