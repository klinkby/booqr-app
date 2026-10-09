import { expect, test } from '@playwright/test';
import { pageScreenshot, setupApiMocks, setupAuthToken, LOCATIONS } from './mocks.js';

test.describe('Admin Locations CRUD', () => {
	test.beforeEach(async ({ page }) => {
		await setupApiMocks(page);
		await setupAuthToken(page);
	});

	test('list page shows locations and the create button', async ({ page }) => {
		await page.goto('/admin/locations');

		const table = page.getByRole('table');
		await expect(table).toBeVisible();
		await expect(table.getByRole('columnheader', { name: 'Name' })).toBeVisible();
		await expect(page.getByText(LOCATIONS[0].name)).toBeVisible();
		await expect(page.getByRole('button', { name: 'Create location' })).toBeVisible();

		await pageScreenshot(page, 'admin-locations');
	});

	test('create button navigates to the new-location form', async ({ page }) => {
		await page.goto('/admin/locations');

		await page.getByRole('button', { name: 'Create location' }).click();

		await expect(page).toHaveURL('/admin/locations/new');
		await expect(page.locator('#name')).toBeVisible();
		await expect(page.locator('#address1')).toBeVisible();
		await expect(page.locator('#city')).toBeVisible();

		await pageScreenshot(page, 'admin-locations-new');
	});

	test('creating a location POSTs and returns to the list', async ({ page }) => {
		let postBody = null;
		await page.route('**/api/locations', (route) => {
			if (route.request().method() === 'POST') {
				postBody = route.request().postDataJSON();
				return route.fulfill({
					status: 201,
					contentType: 'application/json',
					body: JSON.stringify({ id: 99 }),
				});
			}
			return route.fallback();
		});

		await page.goto('/admin/locations/new');

		await page.fill('#name', 'Location C');
		await page.fill('#address1', '3 New Road');
		await page.fill('#zip', '1234');
		await page.fill('#city', 'Copenhagen');
		await page.getByRole('button', { name: 'Create', exact: true }).click();

		await expect(page).toHaveURL('/admin/locations');
		expect(postBody).toMatchObject({
			name: 'Location C',
			address1: '3 New Road',
			zip: '1234',
			city: 'Copenhagen',
		});
	});

	test('editing a location loads existing data and PUTs the update', async ({ page }) => {
		const loc = LOCATIONS[0];
		await page.route(`**/api/locations/${loc.id}`, (route) => {
			const method = route.request().method();
			if (method === 'GET') {
				return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(loc) });
			}
			if (method === 'PUT') {
				return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: loc.id }) });
			}
			return route.fallback();
		});

		await page.goto(`/admin/locations/${loc.id}`);

		await expect(page.locator('#name')).toHaveValue(loc.name);
		await expect(page.locator('#address1')).toHaveValue(loc.address1);
		await expect(page.locator('#city')).toHaveValue(loc.city);

		await pageScreenshot(page, 'admin-locations-edit');

		await page.fill('#name', 'Location A (renamed)');
		await page.getByRole('button', { name: 'Update' }).click();

		await expect(page).toHaveURL('/admin/locations');
	});

	test('cancel on the form returns to the list without saving', async ({ page }) => {
		await page.goto('/admin/locations/new');
		await page.getByRole('button', { name: 'Cancel' }).click();
		await expect(page).toHaveURL('/admin/locations');
	});
});
