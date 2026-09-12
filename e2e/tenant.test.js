import { expect, test } from '@playwright/test';
import { setupApiMocks } from './mocks.js';

test.describe('Tenant resolution', () => {
	test.beforeEach(async ({ page }) => {
		await setupApiMocks(page);
	});

	test('known tenant renders the branded app with correct landmarks', async ({ page }) => {
		// Override the default tenant mock with our test tenant.
		await page.route('**/api/my-tenant*', (route) =>
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ displayName: 'Acme Salon', slug: 'acme' }),
			}),
		);

		await page.goto('/');

		// Assert exactly one <main> element renders (app shell, not the interstitial).
		await expect(page.locator('main')).toHaveCount(1);

		// Assert exactly one h1 (home page heading).
		await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);

		// Skip link must be present (may be visually hidden via sr-only).
		await expect(page.getByRole('link', { name: /skip to main content/i })).toHaveCount(1);

		// Brand link showing the tenant's displayName must be visible.
		await expect(page.getByRole('link', { name: 'Acme Salon' })).toBeVisible();

		// Capture the branded page state.
		await page.screenshot({ path: 'e2e/screenshots/tenant-branded.png', fullPage: true });
	});

	test('unknown subdomain redirects to www.booqr.dk and never shows tenant content', async ({ page }) => {
		// Mock the cross-origin marketing site so the redirect resolves offline.
		await page.route('https://www.booqr.dk/**', (route) =>
			route.fulfill({
				status: 200,
				contentType: 'text/html',
				body: '<!doctype html><title>Marketing</title><h1>Marketing</h1>',
			}),
		);

		// Override the tenant endpoint (last route wins in Playwright) with a 404.
		await page.route('**/api/my-tenant*', (route) =>
			route.fulfill({
				status: 404,
				contentType: 'application/problem+json',
				body: JSON.stringify({
					type: 'https://www.booqr.dk/problems/tenant-not-found',
					title: 'Not Found',
					status: 404,
				}),
			}),
		);

		await page.goto('/');

		// Wait for the redirect to the marketing site.
		await page.waitForURL('https://www.booqr.dk/**');

		// Assert the browser navigated to www.booqr.dk.
		expect(page.url()).toContain('www.booqr.dk');

		// Assert the mocked marketing page's content is visible (no tenant app shell leaked).
		await expect(page.getByRole('heading', { name: 'Marketing' })).toBeVisible();
	});
});

// NOTE: The reserved/apex host branch (booqr.dk, www.booqr.dk, status.booqr.dk)
// renders the marketing view synchronously at tenant module init, detected from
// window.location.hostname without touching the API. This logic is host-driven
// and cannot be exercised via Playwright e2e (which runs on localhost:4173).
// localhost is categorized as a tenant candidate, not reserved, so the reserved
// branch is not reachable here; it lives in hostCategory() in
// src/lib/tenant.svelte.js (RESERVED_HOSTS), which drives it deterministically.
