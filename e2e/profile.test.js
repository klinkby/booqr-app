import { expect, test } from '@playwright/test';
import { pageScreenshot, setupApiMocks, setupAuthToken } from './mocks.js';

test.describe('Profile Page', () => {
	test.beforeEach(async ({ page, context }) => {
		await setupApiMocks(page);
		await setupAuthToken(page);
		await context.clearCookies();
	});

	test('profile page shows bookings calendar and profile form', async ({ page }) => {
		await page.goto('/profile');

		// Wait for profile form to be visible
		await expect(page.locator('input[name="email"]')).toBeVisible();

		// Wait for bookings heading to be visible
		await expect(page.getByRole('heading', { name: /my bookings/i })).toBeVisible();

		// Assert the CTA is present in the calendar toolbar (now a button)
		await expect(page.getByRole('button', { name: /^book$/i })).toBeVisible();

		// Assert at least one booking event is rendered (service name from svc1)
		await expect(page.getByText('Haircut').first()).toBeVisible();

		// Assert each booking exposes an overflow-menu (kebab) button (wired up later)
		await expect(page.getByRole('button', { name: /booking actions/i }).first()).toBeVisible();

		// Name and phone are required and prefilled.
		await expect(page.locator('#name')).toHaveValue('Test Customer');
		await expect(page.locator('#phone')).toHaveValue('12345678');
		await expect(page.locator('#name')).toHaveAttribute('required', '');
		await expect(page.locator('#phone')).toHaveAttribute('required', '');

		// Capture screenshot
		await pageScreenshot(page, 'profile');
	});

	test('bookings calendar localizes day names and uses 24h time in Danish', async ({ page }) => {
		// localStorage is the first locale strategy; seed it before load.
		await page.addInitScript(() => localStorage.setItem('PARAGLIDE_LOCALE', 'da'));
		await page.goto('/profile');

		// Danish day-header (onsdag = Wednesday) and 24-hour event time (10.00).
		await expect(page.getByText('onsdag').first()).toBeVisible();
		await expect(page.getByText(/10\.00.*10\.30/).first()).toBeVisible();
		// No 12-hour AM/PM marker anywhere in the calendar.
		await expect(page.getByText(/\bAM\b|\bPM\b/)).toHaveCount(0);
	});

	test('saving the profile PUTs name and phone', async ({ page }) => {
		let putBody = null;
		await page.route('**/api/users/1', (route) => {
			if (route.request().method() !== 'PUT') return route.fallback();
			putBody = route.request().postDataJSON();
			return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: '1' }) });
		});
		await page.goto('/profile');
		await expect(page.locator('#name')).toHaveValue('Test Customer');
		await page.fill('#name', 'Renamed');
		await page.fill('#phone', '87654321');
		await page.getByRole('button', { name: 'Update', exact: true }).click();
		await expect.poll(() => putBody).toEqual({ name: 'Renamed', phone: '4587654321' });
	});

	test('GDPR export downloads the takeout document as JSON', async ({ page }) => {
		const takeout = {
			schemaVersion: 1,
			exportedAt: '2026-11-07T12:00:00Z',
			tenantSlug: 'acme',
			scope: 'CustomerGdpr',
			users: [{ id: '1', name: 'Test Customer' }],
			locations: [],
			services: [],
			bookings: [],
			calendar: [],
		};
		await page.route('**/api/takeout/me', (route) =>
			route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(takeout) }),
		);
		await page.goto('/profile');

		const downloadPromise = page.waitForEvent('download');
		await page.getByRole('button', { name: 'Download', exact: true }).click();
		const download = await downloadPromise;

		expect(download.suggestedFilename()).toBe('booqr-takeout-acme-2026-11-07.json');
		const chunks = [];
		for await (const chunk of await download.createReadStream()) chunks.push(chunk);
		expect(JSON.parse(Buffer.concat(chunks).toString('utf8'))).toEqual(takeout);
	});

	test('GDPR export shows an error when the request fails', async ({ page }) => {
		await page.route('**/api/takeout/me', (route) => route.fulfill({ status: 500, body: '' }));
		await page.goto('/profile');
		await page.getByRole('button', { name: 'Download', exact: true }).click();
		await expect(page.getByRole('alert')).toBeVisible();
	});
});
