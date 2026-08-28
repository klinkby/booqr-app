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

		// Assert the CTA link exists
		await expect(page.getByRole('link', { name: /book a new appointment/i })).toBeVisible();

		// Assert at least one booking event is rendered (service name from svc1)
		await expect(page.getByText('Haircut').first()).toBeVisible();

		// Capture screenshot
		await page.screenshot({ path: 'e2e/screenshots/profile.png', fullPage: true });
	});
});
