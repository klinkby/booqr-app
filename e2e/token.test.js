import { test, expect } from '@playwright/test';

test('login flow with token validation', async ({ page, context }) => {
	// Step 1: Clear "refresh_token" httponly cookie
	await context.clearCookies();

	// Navigate to home page
	await page.goto('/');

	// Step 2: Click Login in the menu
	await page.click('nav a[href="/login"]');

	// Verify we're on the login page
	await expect(page).toHaveURL('/login');

	// Step 3: Use credentials from .env file for login
	const email = process.env.TEST_EMAIL;
	const password = process.env.TEST_PASSWORD;

	if (!email || !password) {
		throw new Error('TEST_EMAIL and TEST_PASSWORD must be set in .env file');
	}
	// Fill in the login form
	await page.fill('input[name="email"]', email);
	await page.fill('input[name="password"]', password);

	// Submit the form
	await page.click('button[type="submit"]');

	// Step 4: Assert redirect to front page
	await expect(page).toHaveURL('/');

	// Step 5: Assert login is replaced with logout in the menu
	await expect(page.locator('nav button:has-text("Logout")')).toBeVisible();
	await expect(page.locator('nav a[href="/login"]')).not.toBeVisible();

	// Step 6: Assert "access_token" is in sessionStorage
	const accessToken = await page.evaluate(() => sessionStorage.getItem('access_token'));
	expect(accessToken).not.toBeNull();
	expect(accessToken).toBeTruthy();
});
