import { expect, test } from '@playwright/test';
import { pageScreenshot, setupAdminToken, setupApiMocks } from './mocks.js';

// Staff view of one contact's upcoming bookings. Contact id 1 is "Test Customer"
// in the shared mocks; staff are exempt from the 24h cutoff, so every row offers
// the full menu.
test.describe('Admin contact upcoming bookings', () => {
	test.beforeEach(async ({ page, context }) => {
		await setupApiMocks(page);
		await setupAdminToken(page);
		await context.clearCookies();
	});

	test('lists the contact upcoming bookings from now', async ({ page }) => {
		const bookingsRequest = page.waitForRequest((req) => req.url().includes('/my-bookings'));
		await page.goto('/admin/contacts/1/bookings');

		await expect(page.getByRole('heading', { level: 1, name: 'Upcoming appointments' })).toBeVisible();
		await expect(page.getByRole('heading', { level: 2, name: 'Test Customer' })).toBeVisible();
		await expect(page.getByText('Haircut').first()).toBeVisible();

		const request = await bookingsRequest;
		expect(new URL(request.url()).searchParams.has('FromTime')).toBe(true);

		await pageScreenshot(page, 'admin-contact-bookings');
	});

	test('Book navigates to the wizard for this contact', async ({ page }) => {
		await page.goto('/admin/contacts/1/bookings');

		await page.getByRole('button', { name: /^book$/i }).click();
		await expect(page).toHaveURL(/\/\?customer=1$/);
	});

	test('Duplicate from a booking menu opens the wizard for this contact', async ({ page }) => {
		await page.goto('/admin/contacts/1/bookings');

		await page.getByRole('button', { name: 'Booking actions', exact: true }).first().click();
		await page.getByRole('menuitem', { name: /duplicate/i }).click();

		await expect(page).toHaveURL(/\/book\/svc1\?.*customer=1/);
	});

	test('Cancel booking issues a DELETE and shows a success status', async ({ page }) => {
		let deletedId = null;
		await page.route('**/api/bookings/*', (route) => {
			if (route.request().method() === 'DELETE') {
				deletedId = route.request().url().split('/').pop();
				return route.fulfill({ status: 204, body: '' });
			}
			return route.fallback();
		});

		// Staff can cancel every row, so the soonest (~2h) booking is first and the
		// Wednesday booking, booking-e2e-1, is the second kebab.
		await page.goto('/admin/contacts/1/bookings');
		await page.getByRole('button', { name: 'Booking actions', exact: true }).nth(1).click();
		await page.getByRole('menuitem', { name: /cancel booking/i }).click();

		await expect(page.getByRole('status').filter({ hasText: /cancelled/i })).toBeVisible();
		expect(deletedId).toBe('booking-e2e-1');
	});

	test('shows the empty message when the contact has no upcoming bookings', async ({ page }) => {
		// Registered after setupApiMocks, so it overrides the shared my-bookings mock.
		await page.route('**/api/users/*/my-bookings*', (route) =>
			route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [] }) }),
		);
		await page.goto('/admin/contacts/1/bookings');

		await expect(page.getByText('No items found.')).toBeVisible();
	});
});
