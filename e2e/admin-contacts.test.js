import { expect, test } from '@playwright/test';
import { pageScreenshot, setupAdminToken, setupApiMocks, setupAuthToken, FAKE_TOKEN } from './mocks.js';

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
						{ id: 'c1', name: 'Carla Contact', email: 'carla@example.com', phone: '4512345678', role: 'Customer' },
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
		await expect(row.getByRole('link', { name: '+45 12345678' })).toHaveAttribute('href', 'tel:+4512345678');

		// Book, Edit and Delete live in the row's overflow menu.
		await row.getByRole('button', { name: 'Actions' }).click();
		const menu = page.getByRole('menu', { name: 'Actions' });
		const book = menu.getByRole('menuitem', { name: 'Book' });
		await expect(book).toHaveAttribute('href', '/?customer=c1');
		await expect(book).toHaveAccessibleDescription('Carla Contact');
		await expect(menu.getByRole('menuitem', { name: 'Edit' })).toBeVisible();
		// Delete is Admin-only on the API, so an Employee is never offered it.
		await expect(menu.getByRole('menuitem', { name: 'Delete' })).toHaveCount(0);
	});

	test("the signed-in user's own row offers no Delete", async ({ page }) => {
		await setupAdminToken(page);
		await page.route('**/api/users*', (route) =>
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					items: [
						{ id: '1', name: 'Me Myself', email: 'test@example.com', role: 'Employee' },
						{ id: 'c1', name: 'Carla Contact', email: 'carla@example.com', role: 'Customer' },
					],
				}),
			}),
		);

		await page.goto('/admin/contacts');
		await page
			.getByRole('row', { name: /Me Myself/ })
			.getByRole('button', { name: 'Actions' })
			.click();
		const menu = page.getByRole('menu', { name: 'Actions' });
		await expect(menu.getByRole('menuitem', { name: 'Edit' })).toBeVisible();
		await expect(menu.getByRole('menuitem', { name: 'Delete' })).toHaveCount(0);
		await page.keyboard.press('Escape');

		await page
			.getByRole('row', { name: /Carla Contact/ })
			.getByRole('button', { name: 'Actions' })
			.click();
		await expect(page.getByRole('menu', { name: 'Actions' }).getByRole('menuitem', { name: 'Delete' })).toBeVisible();
	});

	test('deleting a contact from the row menu asks for confirmation, then DELETEs', async ({ page }) => {
		await setupAdminToken(page);
		await page.route('**/api/users*', (route) =>
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					items: [{ id: 'c1', name: 'Carla Contact', email: 'carla@example.com', role: 'Customer' }],
				}),
			}),
		);
		let deleted = null;
		await page.route('**/api/users/c1', (route) => {
			if (route.request().method() !== 'DELETE') return route.fallback();
			deleted = route.request().url();
			return route.fulfill({ status: 204 });
		});

		await page.goto('/admin/contacts');
		await page
			.getByRole('row', { name: /Carla Contact/ })
			.getByRole('button', { name: 'Actions' })
			.click();
		await page.getByRole('menuitem', { name: 'Delete' }).click();

		const dialog = page.getByRole('dialog', { name: 'Delete Carla Contact?' });
		await expect(dialog).toBeVisible();
		expect(deleted).toBeNull();
		await dialog.getByRole('button', { name: 'Delete' }).click();

		await expect(dialog).toBeHidden();
		expect(deleted).toMatch(/\/api\/users\/c1$/);
	});
});
