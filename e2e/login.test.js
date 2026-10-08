import { expect, test } from '@playwright/test';
import { pageScreenshot, setupApiMocks, FAKE_TOKEN } from './mocks.js';

test.describe('Login Page', () => {
	test.beforeEach(async ({ page, context }) => {
		await setupApiMocks(page);
		await context.clearCookies();
	});

	test('renders the sign-in form and the forgot-password link', async ({ page }) => {
		await page.goto('/login');

		await expect(page.locator('h1')).toHaveText('Sign in');
		await expect(page.locator('#email')).toBeVisible();
		await expect(page.locator('#password')).toBeVisible();

		const forgot = page.getByRole('link', { name: 'Forgot your password?' });
		await expect(forgot).toHaveAttribute('href', '/change-password');

		await pageScreenshot(page, 'login');
	});

	test('the forgot-password link navigates to the change-password page', async ({ page }) => {
		await page.goto('/login');

		await page.getByRole('link', { name: 'Forgot your password?' }).click();

		await expect(page).toHaveURL('/change-password');
		await expect(page.locator('#reset-email')).toBeVisible();
	});

	test('a successful login redirects to the returnUrl', async ({ page }) => {
		let postBody = null;
		await page.route('**/api/auth/login', (route) => {
			postBody = route.request().postDataJSON();
			return route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ access_token: FAKE_TOKEN }),
			});
		});

		await page.goto('/login?returnUrl=%2Fprofile');

		await page.fill('#email', 'test@example.com');
		await page.fill('#password', 'TestPassword1!');
		await page.getByRole('button', { name: 'Sign in' }).click();

		await expect(page).toHaveURL('/profile');
		expect(postBody).toMatchObject({ email: 'test@example.com', password: 'TestPassword1!' });
	});

	test('a successful login with no returnUrl lands on home', async ({ page }) => {
		await page.route('**/api/auth/login', (route) =>
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ access_token: FAKE_TOKEN }),
			}),
		);

		await page.goto('/login');

		await page.fill('#email', 'test@example.com');
		await page.fill('#password', 'TestPassword1!');
		await page.getByRole('button', { name: 'Sign in' }).click();

		await expect(page).toHaveURL('/');
	});

	test('a failed login shows an error and stays on the login page', async ({ page }) => {
		await page.route('**/api/auth/login', (route) =>
			route.fulfill({
				status: 401,
				contentType: 'application/json',
				body: JSON.stringify({ title: 'Unauthorized' }),
			}),
		);

		await page.goto('/login');

		await page.fill('#email', 'wrong@example.com');
		await page.fill('#password', 'WrongPassword1!');
		await page.getByRole('button', { name: 'Sign in' }).click();

		await expect(page).toHaveURL(/\/login/);
		// Form error region is populated via apiErrorMessage; assert it is non-empty.
		const alert = page.getByRole('alert');
		await expect(alert).toBeVisible();
		await expect(alert).not.toHaveText('');
	});

	test('an unsafe returnUrl is normalized to home', async ({ page }) => {
		await page.route('**/api/auth/login', (route) =>
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ access_token: FAKE_TOKEN }),
			}),
		);

		// A protocol-relative URL must not be honored as an open redirect.
		await page.goto('/login?returnUrl=%2F%2Fevil.example.com');

		await page.fill('#email', 'test@example.com');
		await page.fill('#password', 'TestPassword1!');
		await page.getByRole('button', { name: 'Sign in' }).click();

		await expect(page).toHaveURL('/');
	});
});
