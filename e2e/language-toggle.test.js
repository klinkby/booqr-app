import { expect, test } from '@playwright/test';
import { setupApiMocks } from './mocks.js';

test('language toggle persists and reloads the application in Danish', async ({ page }) => {
	await setupApiMocks(page);

	await page.goto('/');
	await expect(page.locator('h1')).toHaveText('Select a service');

	await page.getByRole('button', { name: 'Skift til dansk' }).click();

	await expect(page.locator('html')).toHaveAttribute('lang', 'da');
	await expect(page.locator('h1')).toHaveText('Vælg en ydelse');
	await expect(page.getByRole('link', { name: 'Log ind' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Switch to English' })).toBeVisible();
});
