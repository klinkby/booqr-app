import { expect, test } from '@playwright/test';
import { pageScreenshot, setupApiMocks, setupAuthToken, FAKE_TOKEN } from './mocks.js';

test.describe('Admin Contacts Page', () => {
	test.beforeEach(async ({ page, context }) => {
		await setupApiMocks(page);
		await context.clearCookies();
	});

	test('unauthenticated visit redirects to login and returns to contacts', async ({ page }) => {
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
		await pageScreenshot(page, 'admin-contacts');
	});

	test('lists name as plain text, phone as a tel: link, and a Book action', async ({ page }) => {
		await setupAuthToken(page);
		await page.route('**/api/users*', (route) =>
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					items: [
						{ id: 'c1', name: 'Carla Contact', email: 'carla@example.com', phone: '+45 12 34 56 78', role: 'Customer' },
					],
				}),
			}),
		);

		await page.goto('/admin/contacts');
		const table = page.getByRole('table');
		const row = table.getByRole('row', { name: /Carla Contact/ });

		await expect(table.getByRole('columnheader', { name: 'Phone' })).toBeVisible();
		await expect(row.getByRole('cell', { name: 'Carla Contact' })).toBeVisible();
		await expect(row.getByRole('link', { name: 'Carla Contact' })).toHaveCount(0);
		await expect(row.getByRole('link', { name: '+45 12 34 56 78' })).toHaveAttribute('href', 'tel:+4512345678');
		await expect(row.getByRole('link', { name: 'Book' })).toHaveAttribute('href', '/?customer=c1');
		await expect(row.getByRole('button', { name: 'Edit' })).toBeVisible();
	});
});
