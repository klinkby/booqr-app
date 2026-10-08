import { expect, test } from '@playwright/test';
import { pageScreenshot, setupApiMocks, setupAuthToken, SERVICES, EMPLOYEES } from './mocks.js';

test.describe('Admin Services CRUD', () => {
	test.beforeEach(async ({ page }) => {
		await setupApiMocks(page);
		await setupAuthToken(page);
	});

	test('list page shows services and the create button', async ({ page }) => {
		await page.goto('/admin/services');

		const table = page.getByRole('table');
		await expect(table).toBeVisible();
		await expect(table.getByRole('columnheader', { name: 'Name' })).toBeVisible();
		await expect(page.getByText(SERVICES[0].name)).toBeVisible();
		await expect(page.getByRole('button', { name: 'Create Service' })).toBeVisible();

		await pageScreenshot(page, 'admin-services');
	});

	test('create button navigates to the new-service form', async ({ page }) => {
		await page.goto('/admin/services');

		await page.getByRole('button', { name: 'Create Service' }).click();

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
		await page.fill('#duration', '00:15:00');
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
		await expect(page.locator('#duration')).toHaveValue(svc.duration);

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
});
