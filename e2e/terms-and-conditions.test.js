import { expect, test } from '@playwright/test';
import { pageScreenshot, setupApiMocks } from './mocks.js';

test.describe('Terms and Conditions Page', () => {
	test.beforeEach(async ({ page }) => {
		await setupApiMocks(page);
	});

	test('renders the heading and placeholder copy', async ({ page }) => {
		await page.goto('/terms-and-conditions');

		await expect(page.locator('h1')).toHaveText('Terms and Conditions');
		await expect(
			page.getByText(
				'These terms and conditions are coming soon. By creating an account you agree to use this service responsibly.',
			),
		).toBeVisible();

		await pageScreenshot(page, 'terms-and-conditions');
	});
});
