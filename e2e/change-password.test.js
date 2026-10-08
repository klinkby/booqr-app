import { expect, test } from '@playwright/test';
import { pageScreenshot, setupApiMocks } from './mocks.js';

// The page computes expiry as `new Date(expires + 'Z') <= new Date()`, so the
// query value must be a bare (no-zone) ISO datetime; append nothing ourselves.
const futureExpires = () => {
	const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
	return d
		.toISOString()
		.replace(/\.\d+Z$/, '')
		.replace('Z', '');
};
const pastExpires = () => {
	const d = new Date(Date.now() - 24 * 60 * 60 * 1000);
	return d
		.toISOString()
		.replace(/\.\d+Z$/, '')
		.replace('Z', '');
};

test.describe('Change Password Page', () => {
	test.beforeEach(async ({ page }) => {
		await setupApiMocks(page);
	});

	test('without an action param, shows the reset-request form', async ({ page }) => {
		await page.goto('/change-password');

		await expect(page.locator('#reset-email')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Request Password Reset' })).toBeVisible();
		// The change form is not shown without a valid action link.
		await expect(page.locator('#password')).toHaveCount(0);

		await pageScreenshot(page, 'change-password');
	});

	test('requesting a reset link POSTs the email and shows the confirmation', async ({ page }) => {
		let postBody = null;
		await page.route('**/api/users/reset-password', (route) => {
			postBody = route.request().postDataJSON();
			return route.fulfill({ status: 204, contentType: 'application/json', body: '{}' });
		});

		await page.goto('/change-password');

		await page.fill('#reset-email', 'forgot@example.com');
		await page.getByRole('button', { name: 'Request Password Reset' }).click();

		await expect(page.getByText('A password reset link has been sent to your email.')).toBeVisible();
		expect(postBody).toMatchObject({ email: 'forgot@example.com' });
	});

	test('an expired reset link shows the expired message and the reset form', async ({ page }) => {
		await page.goto(`/change-password?action=change&expires=${pastExpires()}`);

		await expect(page.getByText('This password reset link has expired. Please request a new one.')).toBeVisible();
		await expect(page.locator('#reset-email')).toBeVisible();

		await pageScreenshot(page, 'change-password-expired');
	});

	test('missing expires on an action link is treated as expired', async ({ page }) => {
		await page.goto('/change-password?action=change');

		await expect(page.getByText('This password reset link has expired. Please request a new one.')).toBeVisible();
	});

	test('a valid action link shows the change-password form', async ({ page }) => {
		await page.goto(`/change-password?action=change&expires=${futureExpires()}`);

		await expect(page.getByRole('button', { name: 'Change Password' })).toBeVisible();
		await expect(page.locator('#password')).toBeVisible();
		await expect(page.locator('#confirm-password')).toBeVisible();

		await pageScreenshot(page, 'change-password-change');
	});

	test('mismatched passwords are rejected client-side without a request', async ({ page }) => {
		let posted = false;
		await page.route('**/api/users/change-password*', (route) => {
			posted = true;
			return route.fulfill({ status: 204, contentType: 'application/json', body: '{}' });
		});

		await page.goto(`/change-password?action=change&expires=${futureExpires()}`);

		await page.fill('#password', 'ValidPass1!');
		await page.fill('#confirm-password', 'DifferentPass1!');
		await page.getByRole('button', { name: 'Change Password' }).click();

		await expect(page.getByText('Passwords do not match.')).toBeVisible();
		expect(posted).toBe(false);
	});

	test('a weak password is rejected client-side without a request', async ({ page }) => {
		let posted = false;
		await page.route('**/api/users/change-password*', (route) => {
			posted = true;
			return route.fulfill({ status: 204, contentType: 'application/json', body: '{}' });
		});

		await page.goto(`/change-password?action=change&expires=${futureExpires()}`);

		// 8+ chars (clears the input's native minlength) but all lowercase, so it
		// fails the complexity pattern and surfaces the custom requirements error.
		await page.fill('#password', 'weakpass');
		await page.fill('#confirm-password', 'weakpass');
		await page.getByRole('button', { name: 'Change Password' }).click();

		await expect(
			page.getByText(
				'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.',
			),
		).toBeVisible();
		expect(posted).toBe(false);
	});

	test('a valid change POSTs the password (with query params) and redirects to login', async ({ page }) => {
		let postBody = null;
		let postUrl = null;
		await page.route('**/api/users/change-password*', (route) => {
			postBody = route.request().postDataJSON();
			postUrl = route.request().url();
			return route.fulfill({ status: 204, contentType: 'application/json', body: '{}' });
		});

		const expires = futureExpires();
		await page.goto(`/change-password?action=change&expires=${encodeURIComponent(expires)}&token=abc123`);

		await page.fill('#password', 'ValidPass1!');
		await page.fill('#confirm-password', 'ValidPass1!');
		await page.getByRole('button', { name: 'Change Password' }).click();

		await expect(page).toHaveURL('/login');
		expect(postBody).toMatchObject({ password: 'ValidPass1!' });
		// The URL query params (token/action/expires) are forwarded on the request.
		expect(postUrl).toContain('token=abc123');
	});
});
