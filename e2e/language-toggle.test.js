import { expect, test } from '@playwright/test';
import { pageScreenshot, setupApiMocks } from './mocks.js';

test('language toggle persists and reloads the application in Danish', async ({ page }) => {
	await setupApiMocks(page);

	const englishRequest = page.waitForRequest('**/api/**');
	await page.goto('/');
	await expect(page.locator('h1')).toHaveText('Select a service');
	expect((await englishRequest).headers()['accept-language']).toBe('en');

	const danishRequest = page.waitForRequest('**/api/**');
	await page.getByRole('button', { name: 'Skift til dansk' }).click();
	expect((await danishRequest).headers()['accept-language']).toBe('da');

	await expect(page.locator('html')).toHaveAttribute('lang', 'da');
	await expect(page.locator('h1')).toHaveText('Vælg en ydelse');
	await expect(page.getByRole('link', { name: 'Log ind' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Switch to English' })).toBeVisible();

	await pageScreenshot(page, 'home-switch-to-danish');
});
