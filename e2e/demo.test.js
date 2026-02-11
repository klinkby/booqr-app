import {expect, test} from '@playwright/test';

test('home page has expected h1', async ({page}) => {
	await page.goto('/');
	await expect(page.locator('h1')).toBeVisible();
	await expect(page.locator('h1')).toHaveText('Welcome to Booqr');
});

test('home page has welcome content', async ({page}) => {
	await page.goto('/');
	await expect(page.getByText('Your modern booking management solution')).toBeVisible();
	await expect(page.getByRole('link', {name: 'logging in'})).toBeVisible();
});
