import { expect, test } from '@playwright/test';
import { pageScreenshot, setupAdminToken, setupApiMocks, setupAuthToken, SERVICES, EMPLOYEES } from './mocks.js';

test.describe('Admin Services CRUD', () => {
	test.beforeEach(async ({ page }) => {
		await setupApiMocks(page);
		await setupAdminToken(page);
	});

	test('list page shows services and the create button', async ({ page }) => {
		await page.goto('/admin/services');

		const table = page.getByRole('table');
		await expect(table).toBeVisible();
		await expect(table.getByRole('columnheader', { name: 'Name' })).toBeVisible();
		await expect(page.getByText(SERVICES[0].name)).toBeVisible();
		await expect(page.getByRole('button', { name: 'Create service' })).toBeVisible();

		await pageScreenshot(page, 'admin-services');
	});

	test('row menu delete confirms, then DELETEs the service', async ({ page }) => {
		const svc = SERVICES[0];
		let deleteCalls = 0;
		await page.route(`**/api/services/${svc.id}`, (route) => {
			if (route.request().method() !== 'DELETE') return route.fallback();
			deleteCalls++;
			return route.fulfill({ status: 204 });
		});

		await page.goto('/admin/services');
		await page
			.getByRole('row', { name: new RegExp(svc.name) })
			.getByRole('button', { name: 'Actions' })
			.click();
		await page.getByRole('menuitem', { name: 'Delete' }).click();
		const dialog = page.getByRole('dialog', { name: `Delete ${svc.name}?` });
		await dialog.getByRole('button', { name: 'Delete' }).click();
		await expect(dialog).toBeHidden();
		expect(deleteCalls).toBe(1);
	});

	test('a failed delete keeps the dialog open with the error', async ({ page }) => {
		const svc = SERVICES[0];
		await page.route(`**/api/services/${svc.id}`, (route) =>
			route.request().method() === 'DELETE' ? route.fulfill({ status: 500 }) : route.fallback(),
		);

		await page.goto('/admin/services');
		await page
			.getByRole('row', { name: new RegExp(svc.name) })
			.getByRole('button', { name: 'Actions' })
			.click();
		await page.getByRole('menuitem', { name: 'Delete' }).click();
		const dialog = page.getByRole('dialog', { name: `Delete ${svc.name}?` });
		await dialog.getByRole('button', { name: 'Delete' }).click();
		await expect(dialog.getByRole('alert')).toBeVisible();
		await expect(dialog).toBeVisible();
	});

	test('create button navigates to the new-service form', async ({ page }) => {
		await page.goto('/admin/services');

		await page.getByRole('button', { name: 'Create service' }).click();

		await expect(page).toHaveURL('/admin/services/new');
		await expect(page.locator('#name')).toBeVisible();
		await expect(page.locator('#duration')).toBeVisible();
		// Employee roster renders as checkboxes.
		await expect(page.locator(`#emp-${EMPLOYEES[0].id}`)).toBeVisible();

		await pageScreenshot(page, 'admin-services-new');
	});

	test('creating a service POSTs and returns to the list', async ({ page }) => {
		let postBody = null;
		await page.route('**/api/services', (route) => {
			if (route.request().method() === 'POST') {
				postBody = route.request().postDataJSON();
				return route.fulfill({
					status: 201,
					contentType: 'application/json',
					body: JSON.stringify({ id: 'svc-new' }),
				});
			}
			return route.fallback();
		});

		await page.goto('/admin/services/new');

		await page.fill('#name', 'Shave');
		await page.fill('#duration', '0:15');
		await page.locator(`#emp-${EMPLOYEES[0].id}`).check();
		await page.getByRole('button', { name: 'Create', exact: true }).click();

		await expect(page).toHaveURL('/admin/services');
		expect(postBody).toMatchObject({ name: 'Shave', duration: '00:15:00' });
		expect(postBody.employees).toContain(EMPLOYEES[0].id);
	});

	test('editing a service loads existing data and PUTs the update', async ({ page }) => {
		const svc = SERVICES[0];
		await page.route(`**/api/services/${svc.id}`, (route) => {
			const method = route.request().method();
			if (method === 'GET') {
				return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(svc) });
			}
			if (method === 'PUT') {
				return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: svc.id }) });
			}
			return route.fallback();
		});

		await page.goto(`/admin/services/${svc.id}`);

		// Existing values are populated from the detail fetch.
		await expect(page.locator('#name')).toHaveValue(svc.name);
		await expect(page.locator('#duration')).toHaveValue('0:30');

		await pageScreenshot(page, 'admin-services-edit');

		await page.fill('#name', 'Haircut Deluxe');
		await page.getByRole('button', { name: 'Update' }).click();

		await expect(page).toHaveURL('/admin/services');
	});

	test('cancel on the form returns to the list without saving', async ({ page }) => {
		await page.goto('/admin/services/new');
		await page.getByRole('button', { name: 'Cancel' }).click();
		await expect(page).toHaveURL('/admin/services');
	});

	test('an Employee has no Services nav link and is denied the page', async ({ page }) => {
		await setupAuthToken(page);
		await page.goto('/admin/services');
		await expect(page.getByRole('alert')).toHaveText(/Access denied/);
		await expect(page.getByRole('table')).toHaveCount(0);
		await expect(
			page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Services' }),
		).toHaveCount(0);
		await expect(
			page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Contacts' }),
		).toBeVisible();
	});
});
