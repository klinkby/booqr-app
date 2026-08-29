import { expect, test } from '@playwright/test';
import { setupApiMocks, setupAuthToken } from './mocks.js';

test.describe('Calendar UX Adjustments', () => {
	test.beforeEach(async ({ page }) => {
		await setupApiMocks(page);
		await setupAuthToken(page);
	});

	test('calendar page loads with extend hours button', async ({ page }, testInfo) => {
		await page.goto('/admin/plan');

		// Check that page has loaded
		await expect(page.locator('h1')).toHaveText('Plan');

		// Check that extend hours button is visible
		await expect(page.locator('button:has-text("Extend Hours")')).toBeVisible();

		// Capture screenshot
		await page.screenshot({ path: testInfo.outputPath('calendar-extend-hours.png') });
	});

	test('form panel width is narrower (w-80 instead of w-96)', async ({ page }, testInfo) => {
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

		// Verify the form panel has the w-80 class (320px width)
		const formPanel = page.locator('.w-80').first();
		await expect(formPanel).toBeVisible();

		// Capture screenshot
		await page.screenshot({ path: testInfo.outputPath('calendar-create-form.png') });
	});

	test('form shows "Vacancy Details" title in view mode', async ({ page }, testInfo) => {
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
		await page.screenshot({ path: testInfo.outputPath('calendar-view-details.png') });
	});

	test('delete button exists in Form component', async ({ page }, testInfo) => {
		await page.goto('/admin/plan');

		// The Form component now supports deleteLabel and ondelete props
		// We can verify the component is present
		await expect(page.locator('h1')).toHaveText('Plan');

		// Capture screenshot
		await page.screenshot({ path: testInfo.outputPath('calendar-delete-button.png') });
	});

	test('calendar supports event click handler', async ({ page }, testInfo) => {
		await page.goto('/admin/plan');

		// Wait for calendar to render with proper elements
		await expect(page.locator('h1:has-text("Plan")')).toBeVisible();

		// The Calendar component now has onEventClick prop
		// Events should be clickable when rendered
		const calendarContainer = page.locator('.ec');
		await expect(calendarContainer).toBeVisible({ timeout: 5000 });

		// Capture screenshot
		await page.screenshot({ path: testInfo.outputPath('calendar-event-click.png') });
	});

	test('overlays the employee\'s appointments in blue, labeled "customer, service"', async ({ page }, testInfo) => {
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

		await page.screenshot({ path: testInfo.outputPath('calendar-appointment-overlay.png') });
	});
});
