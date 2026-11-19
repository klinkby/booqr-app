import { expect, test } from '@playwright/test';
import { pageScreenshot, setupApiMocks, setupAuthToken } from './mocks.js';

test.describe('mobile header', () => {
	test.use({ viewport: { width: 375, height: 667 } });

	test.beforeEach(async ({ page }) => {
		await setupApiMocks(page);
	});

	test('signed out shows Sign in as a button instead of the menu', async ({ page }) => {
		await page.goto('/');
		const header = page.locator('header');
		await expect(header.getByRole('link', { name: 'Sign in' })).toBeVisible();
		await expect(header.getByRole('button', { name: 'Toggle menu' })).toHaveCount(0);

		await pageScreenshot(page, 'mobile-header-signed-out');
		await header.getByRole('link', { name: 'Sign in' }).click();
		await expect(page).toHaveURL(/\/login$/);
	});

	test('signed in shows the menu button', async ({ page }) => {
		await setupAuthToken(page);
		await page.goto('/');
		const header = page.locator('header');
		await expect(header.getByRole('button', { name: 'Toggle menu' })).toBeVisible();
		await expect(header.getByRole('link', { name: 'Sign in' })).toHaveCount(0);
	});
});
