import {expect, test} from '@playwright/test';

test.describe('Dark Mode Support', () => {
	test('should render with light mode by default', async ({page}) => {
		await page.goto('/');
		
		// Verify the page loads
		await expect(page.locator('h1')).toBeVisible();
		
		// Check that header has the base light mode class
		const header = page.locator('header');
		await expect(header).toHaveClass(/bg-gray-800/);
	});

	test('should apply dark mode styles when system prefers dark', async ({browser}) => {
		// Create a context with dark color scheme preference
		const context = await browser.newContext({
			colorScheme: 'dark'
		});
		const page = await context.newPage();
		
		await page.goto('/');
		
		// Verify the page loads
		await expect(page.locator('h1')).toBeVisible();
		
		// Check that dark mode classes are present in the HTML
		const header = page.locator('header');
		await expect(header).toHaveClass(/dark:bg-gray-900/);
		
		const main = page.locator('main');
		await expect(main).toHaveClass(/dark:bg-gray-950/);
		
		const footer = page.locator('footer');
		await expect(footer).toHaveClass(/dark:bg-gray-800/);
		
		await context.close();
	});

	test('should have dark mode utility classes in multiple components', async ({page}) => {
		await page.goto('/');
		
		// Check that various dark mode classes are present
		const mainContent = page.locator('main');
		await expect(mainContent).toHaveClass(/dark:text-gray-100/);
		
		// Check navigation links have dark mode hover states
		const navLinks = page.locator('nav a');
		const firstLink = navLinks.first();
		await expect(firstLink).toHaveClass(/dark:hover:text-gray-400/);
	});
});
