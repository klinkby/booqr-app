import { expect, test } from '@playwright/test';
import { pageScreenshot, setupApiMocks, setupAuthToken } from './mocks.js';

const CONTACT = {
	id: 'contact-42',
	email: 'jane@example.com',
	name: 'Jane Doe',
	phone: '4512345678',
	role: 'Customer',
};

test.describe('Admin Contact Form (create / edit)', () => {
	test.beforeEach(async ({ page }) => {
		await setupApiMocks(page);
		await setupAuthToken(page);
	});

	test('create form shows only the email field', async ({ page }) => {
		await page.goto('/admin/contacts/new');

		await expect(page.locator('#email')).toBeVisible();
		// Name/role fields are edit-only.
		await expect(page.locator('#name')).toHaveCount(0);
		await expect(page.locator('#role')).toHaveCount(0);

		await pageScreenshot(page, 'admin-contacts-new');
	});

	test('creating a contact POSTs the email and returns to the list', async ({ page }) => {
		let postBody = null;
		await page.route('**/api/users', (route) => {
			if (route.request().method() === 'POST') {
				postBody = route.request().postDataJSON();
				return route.fulfill({
					status: 201,
					contentType: 'application/json',
					body: JSON.stringify({ id: 'new-contact' }),
				});
			}
			return route.fallback();
		});

		await page.goto('/admin/contacts/new');

		await page.fill('#email', 'new-contact@example.com');
		await page.getByRole('button', { name: 'Create', exact: true }).click();

		await expect(page).toHaveURL('/admin/contacts');
		expect(postBody).toMatchObject({ email: 'new-contact@example.com' });
	});

	test('edit form loads the contact, shows email as a mailto link, and PUTs name/phone', async ({ page }) => {
		let putBody = null;
		await page.route(`**/api/users/${CONTACT.id}`, (route) => {
			const method = route.request().method();
			if (method === 'GET') {
				return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(CONTACT) });
			}
			if (method === 'PUT') {
				putBody = route.request().postDataJSON();
				return route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify({ id: CONTACT.id }),
				});
			}
			return route.fallback();
		});

		await page.goto(`/admin/contacts/${CONTACT.id}`);

		// Email is a non-editable mailto link in edit mode. It is labelled "Email"
		// via aria-labelledby, so match on the href rather than the a11y name.
		const emailLink = page.locator(`a[href="mailto:${CONTACT.email}"]`);
		await expect(emailLink).toBeVisible();
		await expect(emailLink).toHaveText(CONTACT.email);

		// Name prefilled; role disabled.
		await expect(page.locator('#name')).toHaveValue(CONTACT.name);
		await expect(page.locator('#role')).toBeDisabled();

		await pageScreenshot(page, 'admin-contacts-edit');

		await page.fill('#name', 'Jane Updated');
		await page.getByRole('button', { name: 'Update' }).click();

		await expect(page).toHaveURL('/admin/contacts');
		expect(putBody).toMatchObject({ name: 'Jane Updated' });
		// Edit payload is name/phone only — never the email or role.
		expect(putBody).not.toHaveProperty('email');
		expect(putBody).not.toHaveProperty('role');
	});

	test('cancel on the form returns to the list', async ({ page }) => {
		await page.goto('/admin/contacts/new');
		await page.getByRole('button', { name: 'Cancel' }).click();
		await expect(page).toHaveURL('/admin/contacts');
	});
});
