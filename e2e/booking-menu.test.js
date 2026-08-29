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
		await expect(page.getByRole('button', { name: 'Booking actions', exact: true })).toHaveCount(2);
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
});
