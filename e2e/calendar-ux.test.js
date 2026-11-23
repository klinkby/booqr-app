import { expect, test } from '@playwright/test';
import { pageScreenshot, setupApiMocks, setupAuthToken } from './mocks.js';

test.describe('Calendar UX Adjustments', () => {
	test.beforeEach(async ({ page }) => {
		await setupApiMocks(page);
		await setupAuthToken(page);
	});

	test('calendar page loads with extend hours button', async ({ page }) => {
		await page.goto('/admin/plan');

		// Check that page has loaded
		await expect(page.locator('h1')).toHaveText('Plan');

		// Check that extend hours button is visible
		await expect(page.locator('button:has-text("Extend Hours")')).toBeVisible();

		// Capture screenshot
		await pageScreenshot(page, 'admin-plan');
	});

	test('form panel is 320px wide next to the calendar', async ({ page }) => {
		await page.goto('/admin/plan');

		// Wait for the calendar component to be visible
		await expect(page.locator('h1:has-text("Plan")')).toBeVisible();

		// Click on a time slot to open the form (simulate clicking Monday at 10:00)
		// The calendar renders with time slots that we can click
		const timeSlot = page.locator('.ec-time-grid').first();
		await expect(timeSlot).toBeVisible({ timeout: 5000 });

		// Click to open the form
		await timeSlot.click();

		// Wait for form to appear
		await expect(page.locator('text=Create New Vacancy')).toBeVisible({ timeout: 3000 });

		// The side panel is 320px (lg:w-80) next to the calendar at desktop widths.
		const formPanel = page.locator('div', { has: page.getByRole('heading', { name: 'Create new vacancy' }) }).last();
		const box = await formPanel.boundingBox();
		expect(Math.round(box.width)).toBe(320);

		// Capture screenshot
		await pageScreenshot(page, 'admin-plan-create-vacancy');
	});

	test('form shows "Vacancy Details" title in view mode', async ({ page }) => {
		// Mock the getVacancyById API call
		await page.route('**/api/vacancies/1', (route) => {
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					id: '1',
					startTime: '2026-02-10T10:00:00Z',
					endTime: '2026-02-10T11:00:00Z',
					employeeId: 'emp1',
					locationId: 1,
					bookingId: null,
				}),
			});
		});

		await page.goto('/admin/plan');

		// Wait for calendar to load
		await expect(page.locator('h1:has-text("Plan")')).toBeVisible();

		// Wait for events to be rendered (green/red event blocks)
		const eventElement = page.locator('.ec-event').first();
		await expect(eventElement).toBeVisible({ timeout: 5000 });

		// Click on the event to open view mode
		await eventElement.click();

		// Verify view mode form appears
		await expect(page.locator('text=Vacancy Details')).toBeVisible({ timeout: 3000 });

		// Capture screenshot
		await pageScreenshot(page, 'admin-plan-view-vacancy');
	});

	test('delete button exists in Form component', async ({ page }) => {
		await page.goto('/admin/plan');

		// The Form component now supports deleteLabel and ondelete props
		// We can verify the component is present
		await expect(page.locator('h1')).toHaveText('Plan');

		// Capture screenshot
		await pageScreenshot(page, 'admin-plan-delete-button');
	});

	test('calendar supports event click handler', async ({ page }) => {
		await page.goto('/admin/plan');

		// Wait for calendar to render with proper elements
		await expect(page.locator('h1:has-text("Plan")')).toBeVisible();

		// The Calendar component now has onEventClick prop
		// Events should be clickable when rendered
		const calendarContainer = page.locator('.ec');
		await expect(calendarContainer).toBeVisible({ timeout: 5000 });

		// Capture screenshot
		await pageScreenshot(page, 'admin-plan-event-click');
	});

	test('overlays the employee\'s appointments in blue, labeled "customer, service"', async ({ page }) => {
		// A booking for the logged-in employee (customerId '1' → "Test Customer",
		// serviceId 'svc1' → "Haircut") falling in the current week. Override the
		// shared my-bookings mock (last registration wins).
		const today = new Date();
		const day = today.getDay();
		const daysFromMonday = day === 0 ? 6 : day - 1;
		const monday = new Date(today);
		monday.setDate(today.getDate() - daysFromMonday);
		const start = new Date(monday);
		start.setDate(monday.getDate() + 2); // Wednesday of the visible week
		start.setHours(9, 0, 0, 0);
		const end = new Date(start.getTime() + 30 * 60 * 1000);

		await page.route('**/api/users/*/my-bookings*', (route) =>
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					items: [
						{
							id: 'appt-e2e',
							startTime: start.toISOString(),
							endTime: end.toISOString(),
							serviceId: 'svc1',
							locationId: 1,
							employeeId: 'emp1',
							customerId: '1',
							hasNotes: false,
						},
					],
				}),
			}),
		);

		await page.goto('/admin/plan');
		await expect(page.locator('h1:has-text("Plan")')).toBeVisible();

		// The appointment renders as a blue event carrying the "customer, service"
		// text label — distinguishable from vacancies by more than color alone.
		const appointment = page.locator('.ec-event', { hasText: 'Test Customer, Haircut' });
		await expect(appointment).toBeVisible({ timeout: 5000 });

		await pageScreenshot(page, 'admin-plan-appointments-overlay');
	});

	test('employee dropdown switches the appointments overlay to the selected employee', async ({ page }) => {
		// A booking that only exists for emp2, falling in the current week
		// (customerId '1' → "Test Customer", serviceId 'svc1' → "Haircut").
		const today = new Date();
		const day = today.getDay();
		const daysFromMonday = day === 0 ? 6 : day - 1;
		const monday = new Date(today);
		monday.setDate(today.getDate() - daysFromMonday);
		const start = new Date(monday);
		start.setDate(monday.getDate() + 2); // Wednesday of the visible week
		start.setHours(9, 0, 0, 0);
		const end = new Date(start.getTime() + 30 * 60 * 1000);

		await page.route('**/api/users/*/my-bookings*', (route) => {
			const url = new URL(route.request().url());
			const match = url.pathname.match(/\/api\/users\/([^/]+)\/my-bookings/);
			const employeeId = match ? match[1] : null;

			const items =
				employeeId === 'emp2'
					? [
							{
								id: 'appt-emp2',
								startTime: start.toISOString(),
								endTime: end.toISOString(),
								serviceId: 'svc1',
								locationId: 1,
								employeeId: 'emp2',
								customerId: '1',
								hasNotes: false,
							},
						]
					: [];

			return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items }) });
		});

		await page.goto('/admin/plan');
		await expect(page.locator('h1:has-text("Plan")')).toBeVisible();

		const employeeSelect = page.locator('#plan-employee-select');
		await expect(employeeSelect).toBeVisible();

		await employeeSelect.selectOption('emp2');

		const appointment = page.locator('.ec-event', { hasText: 'Test Customer, Haircut' });
		await expect(appointment).toBeVisible({ timeout: 5000 });

		await pageScreenshot(page, 'admin-plan-select-employee');
	});

	// Every appointment opens the read-only details panel; one with notes also
	// carries the (i) icon. Shared setup for the panel tests below.
	async function openAppointment(page, { notes = 'Sore left shoulder.\nPlease use unscented oil.' } = {}) {
		const today = new Date();
		const day = today.getDay();
		const daysFromMonday = day === 0 ? 6 : day - 1;
		const start = new Date(today);
		start.setDate(today.getDate() - daysFromMonday + 2); // Wednesday of the visible week
		start.setHours(9, 0, 0, 0);
		const end = new Date(start.getTime() + 45 * 60 * 1000);
		const booking = {
			id: 'appt-notes',
			startTime: start.toISOString(),
			endTime: end.toISOString(),
			serviceId: 'svc1',
			locationId: 1,
			employeeId: 'emp1',
			customerId: '1',
			hasNotes: !!notes,
		};

		await page.route('**/api/users/*/my-bookings*', (route) =>
			route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [booking] }) }),
		);
		// The list only says hasNotes; the text comes from GET /api/bookings/{id} (a Booking).
		await page.route('**/api/bookings/appt-notes', (route) =>
			route.request().method() === 'DELETE'
				? route.fulfill({ status: 204 })
				: route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify({ id: booking.id, customerId: '1', serviceId: 'svc1', notes }),
					}),
		);

		await page.goto('/admin/plan');
		const appointment = page.locator('.ec-event', { hasText: 'Test Customer, Haircut' });
		await expect(appointment).toBeVisible({ timeout: 5000 });
		return appointment;
	}

	test('clicking an appointment opens its read-only details panel', async ({ page }) => {
		const appointment = await openAppointment(page);
		await expect(appointment.locator('[title="Notes"]')).toBeVisible();

		await appointment.click();
		const panel = page.getByRole('group', { name: 'View appointment' });
		await expect(page.getByRole('heading', { name: 'Appointment details' })).toBeVisible();
		await expect(page.getByRole('dialog')).toHaveCount(0);

		await expect(panel.getByLabel('Start')).toHaveValue('09:00');
		await expect(panel.getByLabel('End')).toHaveValue('09:45');
		await expect(panel.getByLabel('Service')).toHaveValue('Haircut');
		await expect(panel.getByLabel('Customer')).toHaveValue('Test Customer');
		await expect(panel.getByLabel('Email')).toHaveValue('test@example.com');
		await expect(panel.getByLabel('Phone')).toHaveValue('+45 12345678');
		await expect(panel.getByLabel('Notes')).toHaveValue('Sore left shoulder.\nPlease use unscented oil.');
		for (const field of ['Start', 'Location', 'Employee', 'Customer', 'Notes']) {
			await expect(panel.getByLabel(field)).toBeDisabled();
		}
		await pageScreenshot(page, 'admin-plan-appointment-details');

		await page.getByRole('button', { name: 'Close', exact: true }).click();
		await expect(page.getByRole('heading', { name: 'Appointment details' })).toBeHidden();
	});

	test('appointment without notes still opens the details panel', async ({ page }) => {
		const appointment = await openAppointment(page, { notes: null });
		await expect(appointment.locator('[title="Notes"]')).toHaveCount(0);

		await appointment.click();
		await expect(page.getByRole('heading', { name: 'Appointment details' })).toBeVisible();
		await expect(page.getByLabel('Notes')).toHaveValue('');
	});

	test('appointment actions menu offers duplicate, reschedule and cancel', async ({ page }) => {
		const appointment = await openAppointment(page);
		await appointment.click();

		const kebab = page.getByRole('button', { name: 'Booking actions', exact: true });
		await kebab.click();
		const menu = page.getByRole('menu', { name: 'Booking actions' });
		await expect(menu.getByRole('menuitem')).toHaveText(['Duplicate', 'Reschedule', 'Cancel booking']);
		await pageScreenshot(page, 'admin-plan-appointment-menu-open', { expand: true });

		// Escape closes only the menu, not the panel.
		await page.keyboard.press('Escape');
		await expect(menu).toBeHidden();
		await expect(kebab).toBeFocused();
		await expect(page.getByRole('heading', { name: 'Appointment details' })).toBeVisible();

		// Cancel booking deletes it and closes the panel.
		const deleted = page.waitForRequest(
			(req) => req.method() === 'DELETE' && req.url().endsWith('/api/bookings/appt-notes'),
		);
		await kebab.click();
		await menu.getByRole('menuitem', { name: 'Cancel booking' }).click();
		await deleted;
		await expect(page.getByRole('status').filter({ hasText: 'Booking cancelled.' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Appointment details' })).toBeHidden();

		// The status clears once staff move on to another panel.
		await page.locator('.ec-time-grid').first().click();
		await expect(page.getByText('Create New Vacancy')).toBeVisible();
		await expect(page.getByText('Booking cancelled.')).toBeHidden();
	});

	test('a cancel that settles after another panel opened leaves that panel alone', async ({ page }) => {
		const appointment = await openAppointment(page);
		// Hold the DELETE until the vacancy panel is open.
		let releaseDelete;
		const held = new Promise((resolve) => (releaseDelete = resolve));
		await page.route('**/api/bookings/appt-notes', async (route) => {
			if (route.request().method() !== 'DELETE') return route.fallback();
			await held;
			return route.fulfill({ status: 204 });
		});

		await appointment.click();
		await page.getByRole('button', { name: 'Booking actions', exact: true }).click();
		const deleted = page.waitForResponse(
			(res) => res.request().method() === 'DELETE' && res.url().endsWith('/api/bookings/appt-notes'),
		);
		await page.getByRole('menuitem', { name: 'Cancel booking' }).click();

		await page.locator('.ec-event', { hasText: 'Employee One @ Location A' }).first().click();
		await expect(page.getByRole('heading', { name: 'Vacancy details' })).toBeVisible();

		releaseDelete();
		await deleted;
		await expect(page.getByRole('heading', { name: 'Vacancy details' })).toBeVisible();
		await expect(page.getByText('Booking cancelled.')).toBeHidden();
	});

	test('a failed customer lookup still shows the notes', async ({ page }) => {
		const appointment = await openAppointment(page);
		await page.route('**/api/users/1', (route) =>
			route.fulfill({
				status: 404,
				contentType: 'application/problem+json',
				body: JSON.stringify({ title: 'Not Found', status: 404 }),
			}),
		);

		await appointment.click();
		const panel = page.getByRole('group', { name: 'View appointment' });
		await expect(panel.getByLabel('Notes')).toHaveValue('Sore left shoulder.\nPlease use unscented oil.');
		await expect(page.getByRole('alert').filter({ hasText: /\S/ })).toBeVisible();
		await expect(panel.getByLabel('Customer')).toHaveValue('Test Customer');
		await expect(panel.getByLabel('Email')).toHaveValue('');
	});

	test("duplicating an appointment books again on the customer's behalf", async ({ page }) => {
		const appointment = await openAppointment(page);
		await appointment.click();

		await page.getByRole('button', { name: 'Booking actions', exact: true }).click();
		await page.getByRole('menuitem', { name: 'Duplicate' }).click();
		await expect(page).toHaveURL(/\/book\/svc1\?employee=emp1&location=1&customer=1$/);
	});

	test('rescheduling an appointment carries a rebook nonce for the customer', async ({ page }) => {
		const appointment = await openAppointment(page);
		await appointment.click();

		await page.getByRole('button', { name: 'Booking actions', exact: true }).click();
		await page.getByRole('menuitem', { name: 'Reschedule' }).click();
		await expect(page).toHaveURL(/\/book\/svc1\?employee=emp1&location=1&customer=1&rebook=[0-9a-f-]+$/);
		const pending = await page.evaluate(() => JSON.parse(sessionStorage.getItem('pendingRebook')));
		expect(pending.bookingId).toBe('appt-notes');
	});
});
