import {expect, test} from '@playwright/test';

test.describe('Dark Mode Support', () => {
	test('should render with light mode by default', async ({page}) => {
		await page.goto('/');
		
		// Verify the page loads correctly
		await expect(page.locator('h1')).toBeVisible();
		
		// Check that basic styles are applied
		const header = page.locator('header');
		await expect(header).toBeVisible();
	});

	test('should render with dark mode preference', async ({browser}) => {
		// Create a context with dark color scheme preference
		const context = await browser.newContext({
			colorScheme: 'dark'
		});
		const page = await context.newPage();
		
		await page.goto('/');
		
		// Verify the page loads correctly with dark mode preference
		await expect(page.locator('h1')).toBeVisible();
		
		// Verify basic layout elements are present
		const header = page.locator('header');
		await expect(header).toBeVisible();
		
		const main = page.locator('main');
		await expect(main).toBeVisible();
		
		const footer = page.locator('footer');
		await expect(footer).toBeVisible();
		
		await context.close();
	});
});
