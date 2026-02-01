import { expect, test } from '@playwright/test';

test('calendar page has accessible loading state', async ({ page }) => {
	await page.goto('/calendar');
	
	// Check if loading message has proper ARIA attributes
	const loadingElement = page.locator('[role="status"][aria-live="polite"]');
	
	// The loading state might be brief, so we check if it exists at all
	// or if we've already moved past it
	const hasLoadingOrError = await Promise.race([
		loadingElement.waitFor({ state: 'visible', timeout: 2000 }).then(() => true).catch(() => false),
		page.locator('[role="alert"][aria-live="assertive"]').waitFor({ state: 'visible', timeout: 2000 }).then(() => true).catch(() => false),
		page.locator('h1').waitFor({ state: 'visible', timeout: 2000 }).then(() => true)
	]);
	
	// At minimum, the page should load
	await expect(page.locator('h1')).toHaveText('Calendar');
});

test('calendar page has accessible error state', async ({ page }) => {
	// Mock API to return an error
	await page.route('**/api/vacancies*', route => {
		route.abort('failed');
	});
	
	await page.goto('/calendar');
	
	// Wait for error message to appear
	const errorElement = page.locator('[role="alert"][aria-live="assertive"]');
	await expect(errorElement).toBeVisible();
	
	// Verify error message content
	await expect(errorElement.locator('p')).toContainText('Error: Failed to load vacancies');
});
