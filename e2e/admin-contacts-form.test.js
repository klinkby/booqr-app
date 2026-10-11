import { expect, test } from '@playwright/test';
import { pageScreenshot, setupAdminToken, setupApiMocks, setupAuthToken } from './mocks.js';

const CONTACT = {
	id: 'contact-42',
	email: 'jane@example.com',
	name: 'Jane Doe',
	phone: '4512345678',
	role: 'Customer',
};

const CONFLICT_MESSAGE = "Remove this user's future calendar entries before making them a customer.";

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

		// Name prefilled; role disabled and not changeable by an employee.
		await expect(page.locator('#name')).toHaveValue(CONTACT.name);
		await expect(page.locator('#role')).toBeDisabled();
		await expect(page.getByRole('button', { name: 'Change role' })).toHaveCount(0);

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

test.describe('Admin Contact Form (role change)', () => {
	test.beforeEach(async ({ page }) => {
		await setupApiMocks(page);
		await setupAdminToken(page);
	});

	test('admin viewing their own contact cannot change their role', async ({ page }) => {
		// The mock user '1' is the admin signed in via ADMIN_TOKEN (sub "1").
		await page.route('**/api/users/1', (route) => {
			if (route.request().method() === 'GET') {
				return route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify({ id: '1', name: 'Test Admin', email: 'test@example.com', role: 'Admin' }),
				});
			}
			return route.fallback();
		});

		await page.goto('/admin/contacts/1');

		await expect(page.locator('#role')).toBeDisabled();
		await expect(page.locator('#role')).toHaveValue('Admin');
		await expect(page.getByRole('button', { name: 'Change role' })).toHaveCount(0);
	});

	test('admin changes another user role after confirming; Escape cancels without saving', async ({ page }) => {
		const rolePuts = [];
		await page.route(`**/api/users/${CONTACT.id}`, (route) => {
			if (route.request().method() === 'GET') {
				return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(CONTACT) });
			}
			return route.fallback();
		});
		await page.route(`**/api/users/${CONTACT.id}/role`, (route) => {
			if (route.request().method() === 'PUT') {
				rolePuts.push(route.request().postDataJSON());
				return route.fulfill({ status: 204 });
			}
			return route.fallback();
		});

		await page.goto(`/admin/contacts/${CONTACT.id}`);
		await expect(page.locator('#role')).toHaveValue('Customer');

		await pageScreenshot(page, 'admin-contacts-edit-admin');

		const roleSelect = page.locator('#role');
		const dialog = page.getByRole('dialog', { name: 'Change role?' });

		// Open the dialog and check its content.
		await roleSelect.selectOption('Employee');
		await page.getByRole('button', { name: 'Change role', exact: true }).click();
		await expect(dialog).toBeVisible();
		await expect(dialog).toContainText('Jane Doe');
		await expect(dialog).toContainText('from Customer to Employee');

		await pageScreenshot(page, 'admin-contacts-edit-change-role');

		// Escape closes the dialog only: no save, no navigation, selection reset.
		await page.keyboard.press('Escape');
		await expect(dialog).toBeHidden();
		await expect(page).toHaveURL(`/admin/contacts/${CONTACT.id}`);
		await expect(roleSelect).toHaveValue('Customer');
		expect(rolePuts).toHaveLength(0);

		// Reopen and confirm: PUT with the new role and a success message.
		await roleSelect.selectOption('Employee');
		await page.getByRole('button', { name: 'Change role', exact: true }).click();
		await dialog.getByRole('button', { name: 'Change role', exact: true }).click();

		await expect(dialog).toBeHidden();
		await expect(page.getByText('Role changed.', { exact: true })).toBeVisible();
		expect(rolePuts).toEqual([{ role: 'Employee' }]);
	});

	test('a 409 conflict on role change shows the conflict message in the form alert', async ({ page }) => {
		await page.route(`**/api/users/${CONTACT.id}`, (route) => {
			if (route.request().method() === 'GET') {
				return route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify({ ...CONTACT, role: 'Employee' }),
				});
			}
			return route.fallback();
		});
		await page.route(`**/api/users/${CONTACT.id}/role`, (route) => {
			if (route.request().method() === 'PUT') {
				return route.fulfill({
					status: 409,
					contentType: 'application/json',
					body: JSON.stringify({ title: 'Conflict' }),
				});
			}
			return route.fallback();
		});

		await page.goto(`/admin/contacts/${CONTACT.id}`);
		await expect(page.locator('#role')).toHaveValue('Employee');

		// Demoting to Customer is the case that can conflict with future calendar entries.
		await page.locator('#role').selectOption('Customer');
		await page.getByRole('button', { name: 'Change role', exact: true }).click();
		const dialog = page.getByRole('dialog', { name: 'Change role?' });
		await dialog.getByRole('button', { name: 'Change role', exact: true }).click();

		await expect(dialog).toBeHidden();
		await expect(page.getByRole('alert')).toContainText(CONFLICT_MESSAGE);
	});
});
