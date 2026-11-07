import { expect, test } from '@playwright/test';
import { pageScreenshot, setupAdminToken, setupApiMocks, setupAuthToken } from './mocks.js';

test.describe('Profile Page', () => {
	test.beforeEach(async ({ page, context }) => {
		await setupApiMocks(page);
		await setupAuthToken(page);
		await context.clearCookies();
	});

	test('profile page shows bookings calendar and profile form', async ({ page }) => {
		await page.goto('/profile');

		// Wait for profile form to be visible
		await expect(page.locator('input[name="email"]')).toBeVisible();

		// Wait for bookings heading to be visible
		await expect(page.getByRole('heading', { name: /my bookings/i })).toBeVisible();

		// Assert the CTA is present in the calendar toolbar (now a button)
		await expect(page.getByRole('button', { name: /^book$/i })).toBeVisible();

		// Assert at least one booking event is rendered (service name from svc1)
		await expect(page.getByText('Haircut').first()).toBeVisible();

		// Assert each booking exposes an overflow-menu (kebab) button (wired up later)
		await expect(page.getByRole('button', { name: /booking actions/i }).first()).toBeVisible();

		// Name and phone are required and prefilled.
		await expect(page.locator('#name')).toHaveValue('Test Customer');
		await expect(page.locator('#phone')).toHaveValue('12345678');
		await expect(page.locator('#name')).toHaveAttribute('required', '');
		await expect(page.locator('#phone')).toHaveAttribute('required', '');

		// Capture screenshot
		await pageScreenshot(page, 'profile');
	});

	test('bookings calendar localizes day names and uses 24h time in Danish', async ({ page }) => {
		// localStorage is the first locale strategy; seed it before load.
		await page.addInitScript(() => localStorage.setItem('PARAGLIDE_LOCALE', 'da'));
		await page.goto('/profile');

		// Danish day-header (onsdag = Wednesday) and 24-hour event time (10.00).
		await expect(page.getByText('onsdag').first()).toBeVisible();
		await expect(page.getByText(/10\.00.*10\.30/).first()).toBeVisible();
		// No 12-hour AM/PM marker anywhere in the calendar.
		await expect(page.getByText(/\bAM\b|\bPM\b/)).toHaveCount(0);
	});

	test('saving the profile PUTs name and phone', async ({ page }) => {
		let putBody = null;
		await page.route('**/api/users/1', (route) => {
			if (route.request().method() !== 'PUT') return route.fallback();
			putBody = route.request().postDataJSON();
			return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: '1' }) });
		});
		await page.goto('/profile');
		await expect(page.locator('#name')).toHaveValue('Test Customer');
		await page.fill('#name', 'Renamed');
		await page.fill('#phone', '87654321');
		await page.getByRole('button', { name: 'Update', exact: true }).click();
		await expect.poll(() => putBody).toEqual({ name: 'Renamed', phone: '4587654321' });
	});

	test('GDPR export downloads the takeout document as JSON', async ({ page }) => {
		const takeout = {
			schemaVersion: 1,
			exportedAt: '2026-11-07T12:00:00Z',
			tenantSlug: 'acme',
			scope: 'CustomerGdpr',
			users: [{ id: '1', name: 'Test Customer' }],
			locations: [],
			services: [],
			bookings: [],
			calendar: [],
		};
		await page.route('**/api/takeout/me', (route) =>
			route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(takeout) }),
		);
		await page.goto('/profile');

		const downloadPromise = page.waitForEvent('download');
		await page.getByRole('button', { name: 'Download', exact: true }).click();
		const download = await downloadPromise;

		expect(download.suggestedFilename()).toBe('booqr-takeout-acme-2026-11-07.json');
		const chunks = [];
		for await (const chunk of await download.createReadStream()) chunks.push(chunk);
		expect(JSON.parse(Buffer.concat(chunks).toString('utf8'))).toEqual(takeout);
	});

	test('GDPR export shows an error when the request fails', async ({ page }) => {
		await page.route('**/api/takeout/me', (route) => route.fulfill({ status: 500, body: '' }));
		await page.goto('/profile');
		await page.getByRole('button', { name: 'Download', exact: true }).click();
		await expect(page.getByRole('alert')).toBeVisible();
	});

	test('non-admins do not see the backup panel', async ({ page }) => {
		await page.goto('/profile');
		await expect(page.locator('input[name="email"]')).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Backup' })).toHaveCount(0);
		await expect(page.getByLabel('Restore backup (advanced)')).toHaveCount(0);
	});
});

test.describe('Profile Page (admin backup)', () => {
	const backup = {
		schemaVersion: 1,
		exportedAt: '2026-11-07T12:00:00Z',
		tenantSlug: 'acme',
		scope: 'TenantWorkspace',
		users: [{ id: '1', name: 'Test Customer' }],
		locations: [],
		services: [],
		bookings: [],
		calendar: [],
	};
	const counts = (created, matched, skipped) => ({ created, matched, skipped });

	/** Mocks GET/POST /api/takeout (with or without a query) and records each POST's DryRun flag. */
	async function mockTakeout(page, { dryRunResponse } = {}) {
		const posts = [];
		await page.route(
			(url) => url.pathname === '/api/takeout',
			(route) => {
				const request = route.request();
				if (request.method() === 'GET') {
					return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(backup) });
				}
				const dryRun = new URL(request.url()).searchParams.get('DryRun');
				posts.push({ dryRun, body: request.postDataJSON() });
				return route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify({ ...dryRunResponse, dryRun: dryRun === 'true' }),
				});
			},
		);
		return posts;
	}

	test.beforeEach(async ({ page, context }) => {
		await setupApiMocks(page);
		await setupAdminToken(page);
		await context.clearCookies();
	});

	test('downloads the organization backup as JSON', async ({ page }) => {
		await mockTakeout(page);
		await page.goto('/profile');
		const panel = page.getByRole('region', { name: 'Backup' });

		const downloadPromise = page.waitForEvent('download');
		await panel.getByRole('button', { name: 'Download', exact: true }).click();
		const download = await downloadPromise;

		expect(download.suggestedFilename()).toBe('booqr-takeout-acme-2026-11-07.json');
		const chunks = [];
		for await (const chunk of await download.createReadStream()) chunks.push(chunk);
		expect(JSON.parse(Buffer.concat(chunks).toString('utf8'))).toEqual(backup);
	});

	test('restore dry-runs the file, previews the result, and imports on confirm', async ({ page }) => {
		const posts = await mockTakeout(page, {
			dryRunResponse: {
				users: counts(1, 2, 0),
				locations: counts(0, 1, 0),
				services: counts(0, 0, 0),
				bookings: counts(3, 0, 1),
				calendar: counts(0, 0, 2),
				warnings: [{ code: 'CalendarOverlapSkipped', entity: 'calendar', sourceId: 7, message: 'Slot 7 overlaps.' }],
			},
		});
		await page.goto('/profile');

		await page.getByLabel('Restore backup (advanced)').setInputFiles({
			name: 'backup.json',
			mimeType: 'application/json',
			buffer: Buffer.from(JSON.stringify(backup)),
		});

		const dialog = page.getByRole('dialog', { name: 'Restore backup?' });
		await expect(dialog).toBeVisible();
		await expect(dialog.getByRole('row', { name: /Bookings/ })).toContainText('3');
		await expect(dialog.getByText('Slot 7 overlaps.')).toBeVisible();
		expect(posts).toEqual([{ dryRun: 'true', body: backup }]);
		await pageScreenshot(page, 'profile-restore-backup');

		await dialog.getByRole('button', { name: 'Restore', exact: true }).click();
		await expect(page.getByRole('status').filter({ hasText: 'Backup restored.' })).toBeVisible();
		await expect(dialog).toBeHidden();
		expect(posts.map((p) => p.dryRun)).toEqual(['true', 'false']);
	});

	test('cancelling the preview does not import', async ({ page }) => {
		const posts = await mockTakeout(page, { dryRunResponse: { warnings: [] } });
		await page.goto('/profile');
		await page.getByLabel('Restore backup (advanced)').setInputFiles({
			name: 'backup.json',
			mimeType: 'application/json',
			buffer: Buffer.from(JSON.stringify(backup)),
		});
		const dialog = page.getByRole('dialog', { name: 'Restore backup?' });
		await dialog.getByRole('button', { name: 'Cancel' }).click();
		await expect(dialog).toBeHidden();
		expect(posts.map((p) => p.dryRun)).toEqual(['true']);
	});

	test('a failed dry run shows the error in the panel and opens no dialog', async ({ page }) => {
		const posts = [];
		await page.route(
			(url) => url.pathname === '/api/takeout',
			(route) => {
				posts.push(new URL(route.request().url()).searchParams.get('DryRun'));
				return route.fulfill({
					status: 400,
					contentType: 'application/problem+json',
					body: JSON.stringify({
						type: 'https://booqr.dk/problems/validation',
						title: 'One or more validation errors occurred.',
						status: 400,
						errors: { schemaVersion: ['Unsupported takeout schema version 99.'] },
					}),
				});
			},
		);
		await page.goto('/profile');
		await page.getByLabel('Restore backup (advanced)').setInputFiles({
			name: 'backup.json',
			mimeType: 'application/json',
			buffer: Buffer.from(JSON.stringify({ ...backup, schemaVersion: 99 })),
		});

		const panel = page.getByRole('region', { name: 'Backup' });
		await expect(panel.getByRole('alert')).toContainText('Unsupported takeout schema version 99.');
		await expect(panel.getByRole('link', { name: /error details/i })).toHaveAttribute(
			'href',
			'https://booqr.dk/problems/validation',
		);
		await expect(page.getByRole('dialog')).toBeHidden();
		expect(posts).toEqual(['true']);
		await pageScreenshot(page, 'profile-restore-backup-failed');
	});

	test('an invalid file is rejected without calling the API', async ({ page }) => {
		const posts = await mockTakeout(page);
		await page.goto('/profile');
		await page.getByLabel('Restore backup (advanced)').setInputFiles({
			name: 'notes.json',
			mimeType: 'application/json',
			buffer: Buffer.from('{"hello":"world"}'),
		});
		await expect(page.getByRole('alert').filter({ hasText: 'The file is not a valid backup.' })).toBeVisible();
		expect(posts).toEqual([]);
	});
});
