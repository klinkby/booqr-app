import { expect, test } from '@playwright/test';
import { setupApiMocks, setupAuthToken } from './mocks.js';

test.describe('My Bookings overflow menu', () => {
	test.beforeEach(async ({ page, context }) => {
		await setupApiMocks(page);
		await setupAuthToken(page);
		await context.clearCookies();
		await page.goto('/profile');
	});

	test('booking rows are not interactive buttons — only the kebab is', async ({ page }) => {
		// The profile page passes no onEventClick, so the calendar must not mark the
		// booking rows as role="button" (which also nested the kebab button inside a
		// button). The only buttons in a row are the kebab overflow triggers.
		await expect(page.getByRole('button', { name: /haircut/i })).toHaveCount(0);
	});

	test('hides the overflow menu for bookings within 24 hours', async ({ page }) => {
		// The mock returns three bookings: two comfortably in the future and one
		// ~2h out. Reschedule/cancel are not allowed inside 24h, so that row's kebab
		// is not offered — only the two future bookings expose an operable one.
		await expect(page.getByRole('listitem')).toHaveCount(3);
		await expect(page.getByRole('button', { name: 'Booking actions', exact: true })).toHaveCount(2);

		// The within-24h row still renders a kebab element (kept for layout so the
		// row keeps its width), but it is visibility:hidden — present in the DOM,
		// absent from the a11y tree, and not visible. It's the first row (the ~2h
		// booking is the earliest), so target the first kebab by CSS.
		const allKebabs = page.locator('button[aria-label="Booking actions"]');
		await expect(allKebabs).toHaveCount(3);
		await expect(allKebabs.first()).toBeHidden();
		await expect(allKebabs.first()).toHaveAttribute('tabindex', '-1');
	});

	test('opens an accessible menu and stacks above the rows below it', async ({ page }) => {
		// The kebab (⋮). Exact name targets the button itself.
		const kebab = page.getByRole('button', { name: 'Booking actions', exact: true }).first();
		await expect(kebab).toBeVisible();
		await expect(kebab).toHaveAttribute('aria-haspopup', 'menu');
		await expect(kebab).toHaveAttribute('aria-expanded', 'false');

		await kebab.click();
		await expect(kebab).toHaveAttribute('aria-expanded', 'true');

		// Both actions are exposed as real menu items.
		const menu = page.getByRole('menu', { name: /booking actions/i });
		await expect(menu).toBeVisible();
		const reschedule = page.getByRole('menuitem', { name: /reschedule/i });
		const cancel = page.getByRole('menuitem', { name: /cancel booking/i });
		await expect(reschedule).toBeVisible();
		await expect(cancel).toBeVisible();

		// z-index regression guard: the popup must render ABOVE the day-header and
		// booking row beneath it, not behind them. Probe the document's top-most
		// element at a point inside the menu — it must be the menu (or its child),
		// never one of the underlying calendar rows.
		const menuBox = await menu.boundingBox();
		const topmostInsideMenu = await page.evaluate(
			({ x, y }) => {
				const el = document.elementFromPoint(x, y);
				return !!el?.closest('[role="menu"]');
			},
			{ x: menuBox.x + menuBox.width / 2, y: menuBox.y + menuBox.height - 4 },
		);
		expect(topmostInsideMenu).toBe(true);

		await page.screenshot({ path: 'e2e/screenshots/booking-menu-open.png', fullPage: true });

		// Escape closes the menu and returns focus to the trigger.
		await page.keyboard.press('Escape');
		await expect(menu).toBeHidden();
		await expect(kebab).toBeFocused();
	});

	test('Cancel booking issues a DELETE and shows a success status', async ({ page }) => {
		// Capture the cancel request and satisfy it with the API's 204-style empty
		// success, plus refetch after invalidation.
		let deletedId = null;
		await page.route('**/api/bookings/*', (route) => {
			if (route.request().method() === 'DELETE') {
				deletedId = route.request().url().split('/').pop();
				return route.fulfill({ status: 204, body: '' });
			}
			return route.fallback();
		});

		const kebab = page.getByRole('button', { name: 'Booking actions', exact: true }).first();
		await kebab.click();
		await page.getByRole('menuitem', { name: /cancel booking/i }).click();

		// Success is announced via role="status"; the DELETE targeted the row's id.
		await expect(page.getByRole('status').filter({ hasText: /cancelled/i })).toBeVisible();
		expect(deletedId).toBe('booking-e2e-1');
	});

	test('a forbidden cancel surfaces an accessible error', async ({ page }) => {
		// A 403 (e.g. cancelling too late / another user's booking) must render as a
		// role="alert", aligned with how the profile form and plan page show errors.
		await page.route('**/api/bookings/*', (route) => {
			if (route.request().method() === 'DELETE') {
				return route.fulfill({
					status: 403,
					contentType: 'application/problem+json',
					body: JSON.stringify({ title: 'Forbidden' }),
				});
			}
			return route.fallback();
		});

		const kebab = page.getByRole('button', { name: 'Booking actions', exact: true }).first();
		await kebab.click();
		await page.getByRole('menuitem', { name: /cancel booking/i }).click();

		await expect(page.getByRole('alert').filter({ hasText: /forbidden/i })).toBeVisible();
	});
});

// The 24h cutoff compares the booking's instant to now, so it must stay correct
// in any viewer timezone (a naive local-wall-clock comparison would drift by the
// UTC offset). Pin a far-from-UTC zone and a booking ~23h out: it must read as
// inside the cutoff (no kebab), not outside it. Guards the cutoff's timezone
// correctness against future refactors of the time math.
test.describe('My Bookings 24h cutoff is timezone-correct', () => {
	test.use({ timezoneId: 'Australia/Brisbane' }); // UTC+10, no DST

	test('a booking ~23h out (across the UTC offset) still hides its menu', async ({ page, context }) => {
		await setupApiMocks(page);
		await setupAuthToken(page);
		await context.clearCookies();
		// Override just my-bookings (last route wins) with a single ~23h-out booking.
		const start = new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString();
		const end = new Date(Date.now() + 23.5 * 60 * 60 * 1000).toISOString();
		await page.route('**/api/users/*/my-bookings*', (r) =>
			r.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					items: [
						{
							id: 'b1',
							startTime: start,
							endTime: end,
							serviceId: 'svc1',
							locationId: 1,
							employeeId: 'emp1',
							hasNotes: false,
						},
					],
				}),
			}),
		);

		await page.goto('/profile');
		// The booking renders…
		await expect(page.getByText('Haircut').first()).toBeVisible();
		// …but is within 24h, so no overflow menu is offered.
		await expect(page.getByRole('button', { name: 'Booking actions', exact: true })).toHaveCount(0);
	});
});
