import { expect, test } from '@playwright/test';
import { setupApiMocks, FAKE_TOKEN } from './mocks.js';

test.describe('Login flow with token validation', () => {
	test.beforeEach(async ({ page, context }) => {
		await setupApiMocks(page);
		await context.clearCookies();
	});

	test('full login flow stores token and updates nav', async ({ page }) => {
		const email = process.env.TEST_EMAIL ?? 'test@example.com';
		const password = process.env.TEST_PASSWORD ?? 'TestPassword1!';

		// Mock the login endpoint and capture the request for later assertions
		let loginRequest = null;
		await page.route('**/api/auth/login', async (route) => {
			loginRequest = route.request();
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ access_token: FAKE_TOKEN }),
			});
		});

		await page.goto('/');
		await page.click('nav a[href="/login"]');
		await expect(page).toHaveURL('/login');

		await page.fill('input[name="email"]', email);
		await page.fill('input[name="password"]', password);
		await page.click('button[type="submit"]');

		// Verify the login POST was called with the correct credentials
		expect(loginRequest).not.toBeNull();
		const body = JSON.parse(loginRequest.postData());
		expect(body.email).toBe(email);
		expect(body.password).toBe(password);

		// Verify redirect and nav state after login
		await expect(page).toHaveURL('/');
		await expect(page.locator('nav button:has-text("Logout")')).toBeVisible();
		await expect(page.locator('nav a[href="/login"]')).not.toBeVisible();

		// Verify token stored in sessionStorage
		const accessToken = await page.evaluate(() => sessionStorage.getItem('access_token'));
		expect(accessToken).toBeTruthy();
	});
});
