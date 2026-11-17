import { expect, test } from '@playwright/test';
import { pageScreenshot, setupAdminToken, setupApiMocks, setupAuthToken, LOCATIONS } from './mocks.js';

test.describe('Admin Locations CRUD', () => {
	test.beforeEach(async ({ page }) => {
		await setupApiMocks(page);
		await setupAdminToken(page);
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

	test('row menu edits a location', async ({ page }) => {
		await page.goto('/admin/locations');
		const trigger = page
			.getByRole('row', { name: new RegExp(LOCATIONS[0].name) })
			.getByRole('button', { name: 'Actions' });
		// The trigger is described by its row's first cell, so screen readers hear which row it acts on.
		await expect(trigger).toHaveAccessibleDescription(LOCATIONS[0].name);
		await trigger.click();
		await page.getByRole('menuitem', { name: 'Edit' }).click();
		await expect(page).toHaveURL(`/admin/locations/${LOCATIONS[0].id}`);
	});

	test('row menu delete confirms, then DELETEs the location', async ({ page }) => {
		const loc = LOCATIONS[0];
		let deleteCalls = 0;
		await page.route(`**/api/locations/${loc.id}`, (route) => {
			if (route.request().method() !== 'DELETE') return route.fallback();
			deleteCalls++;
			return route.fulfill({ status: 204 });
		});

		await page.goto('/admin/locations');
		const trigger = page.getByRole('row', { name: new RegExp(loc.name) }).getByRole('button', { name: 'Actions' });

		// Cancelling the confirmation sends nothing and returns focus to the trigger.
		await trigger.click();
		await page.getByRole('menuitem', { name: 'Delete' }).click();
		const dialog = page.getByRole('dialog', { name: `Delete ${loc.name}?` });
		await expect(dialog).toBeVisible();
		await pageScreenshot(page, 'admin-locations-delete-confirm');
		await dialog.getByRole('button', { name: 'Cancel' }).click();
		await expect(dialog).toBeHidden();
		await expect(trigger).toBeFocused();
		expect(deleteCalls).toBe(0);

		await trigger.click();
		await page.getByRole('menuitem', { name: 'Delete' }).click();
		await dialog.getByRole('button', { name: 'Delete' }).click();
		await expect(dialog).toBeHidden();
		expect(deleteCalls).toBe(1);
	});

	test('row menu: Escape closes it and returns focus to the trigger', async ({ page }) => {
		await page.goto('/admin/locations');
		const trigger = page
			.getByRole('row', { name: new RegExp(LOCATIONS[0].name) })
			.getByRole('button', { name: 'Actions' });
		await trigger.click();
		const menu = page.getByRole('menu', { name: 'Actions' });
		await expect(menu.getByRole('menuitem', { name: 'Edit' })).toBeFocused();
		await page.keyboard.press('ArrowDown');
		await expect(menu.getByRole('menuitem', { name: 'Delete' })).toBeFocused();
		await pageScreenshot(page, 'admin-locations-menu-open');
		await page.keyboard.press('Escape');
		await expect(menu).toBeHidden();
		await expect(trigger).toBeFocused();
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

	test('an Employee has no Locations nav link and is denied the page', async ({ page }) => {
		await setupAuthToken(page);
		await page.goto('/admin/locations');
		await expect(page.getByRole('alert')).toHaveText(/Access denied/);
		await expect(page.getByRole('table')).toHaveCount(0);
		await expect(
			page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Locations' }),
		).toHaveCount(0);
		await expect(
			page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Contacts' }),
		).toBeVisible();
	});
});
