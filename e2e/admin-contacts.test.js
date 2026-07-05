import { expect, test } from '@playwright/test';
import { setupApiMocks, FAKE_TOKEN } from './mocks.js';

test.describe('Admin Contacts Page', () => {
	test.beforeEach(async ({ page, context }) => {
		await setupApiMocks(page);
		await context.clearCookies();
	});

	test('unauthenticated visit redirects to login and returns to contacts', async ({ page }, testInfo) => {
		const email = process.env.TEST_EMAIL ?? 'test@example.com';
		const password = process.env.TEST_PASSWORD ?? 'TestPassword1!';

		// Mock the login endpoint
		await page.route('**/api/auth/login', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ access_token: FAKE_TOKEN }),
			});
		});

		// Navigate directly to admin contacts
		await page.goto('/admin/contacts');

		// Expect redirect to login
		await expect(page).toHaveURL(/\/login\?returnUrl=%2Fadmin%2Fcontacts/);

		// Fill login form
		await page.fill('input[name="email"]', email);
		await page.fill('input[name="password"]', password);
		await page.click('button[type="submit"]');

		// Assert navigation reaches /admin/contacts
		await expect(page).toHaveURL('/admin/contacts');

		// Assert contacts table is visible
		const table = page.getByRole('table');
		await expect(table).toBeVisible();

		// Verify key headers to ensure it's the right table
		await expect(table.getByRole('columnheader', { name: 'Name' })).toBeVisible();
		await expect(table.getByRole('columnheader', { name: 'Role' })).toBeVisible();

		// Capture screenshot
		await page.screenshot({ path: testInfo.outputPath('admin-contacts-table.png') });
	});
});
