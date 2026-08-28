import { expect, test } from '@playwright/test';
import { setupApiMocks, setupAuthToken } from './mocks.js';

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
		await expect(page.getByRole('button', { name: /book a new appointment/i })).toBeVisible();

		// Assert at least one booking event is rendered (service name from svc1)
		await expect(page.getByText('Haircut').first()).toBeVisible();

		// Assert each booking exposes an overflow-menu (kebab) button (wired up later)
		await expect(page.getByRole('button', { name: /booking actions/i }).first()).toBeVisible();

		// Capture screenshot
		await page.screenshot({ path: 'e2e/screenshots/profile.png', fullPage: true });
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
});
