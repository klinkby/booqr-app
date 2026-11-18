import { expect, test } from '@playwright/test';
import { pageScreenshot, setupAdminToken, setupApiMocks, setupAuthToken } from './mocks.js';

function localDate(d) {
	const pad = (n) => String(n).padStart(2, '0');
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const ACTIVITIES = [
	{
		id: 1,
		timestamp: new Date().toISOString(),
		requestId: 'req-1',
		userId: 7,
		entity: 'Booking',
		entityId: 42,
		action: 'Create',
		tenantId: 1,
	},
];

test.describe('Admin activity log', () => {
	/** @type {URL[]} */
	let requests;

	test.beforeEach(async ({ page }) => {
		requests = [];
		await setupApiMocks(page);
		await page.route('**/api/activities*', (route) => {
			requests.push(new URL(route.request().url()));
			return route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ items: ACTIVITIES }),
			});
		});
	});

	test('admin nav links to the log, which defaults to today at midnight', async ({ page }) => {
		await setupAdminToken(page);
		await page.goto('/admin/plan');
		await page.getByRole('navigation').getByRole('link', { name: 'Log' }).first().click();
		await expect(page).toHaveURL('/admin/log');

		await expect(page.getByRole('heading', { level: 1, name: 'Log' })).toBeVisible();
		const table = page.getByRole('table');
		for (const name of ['Time', 'User', 'Entity', 'Action']) {
			await expect(table.getByRole('columnheader', { name, exact: true })).toBeVisible();
		}
		await expect(table.getByRole('cell', { name: 'Booking' })).toBeVisible();
		await expect(table.getByRole('link', { name: '7' })).toHaveAttribute('href', '/admin/contacts/7');

		const today = new Date();
		await expect(page.getByLabel('From')).toHaveValue(localDate(today));
		today.setHours(0, 0, 0, 0);
		expect(requests.at(-1).searchParams.get('FromTime')).toBe(today.toISOString());
		expect(requests.at(-1).searchParams.get('Num')).toBe('100');

		await pageScreenshot(page, 'admin-log');
	});

	test('picking a date refetches from that day at midnight', async ({ page }) => {
		await setupAdminToken(page);
		await page.goto('/admin/log');
		await expect(page.getByRole('table')).toBeVisible();

		await page.getByLabel('From').fill('2026-01-15');
		await expect(page).toHaveURL('/admin/log?from=2026-01-15');
		await expect
			.poll(() => requests.at(-1).searchParams.get('FromTime'))
			.toBe(new Date('2026-01-15T00:00').toISOString());
	});

	test('employees do not see the log link', async ({ page }) => {
		await setupAuthToken(page);
		await page.goto('/admin/plan');
		await expect(page.getByRole('navigation').getByRole('link', { name: 'Log' })).toHaveCount(0);
	});
});
