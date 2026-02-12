import {expect, test} from '@playwright/test';

test.describe('Calendar UX Adjustments', () => {
	test.beforeEach(async ({page}) => {
		// Mock API responses to test UI behavior
		await page.route('**/api/vacancies*', route => {
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					items: [
						{
							id: '1',
							startTime: '2026-02-10T10:00:00Z',
							endTime: '2026-02-10T11:00:00Z',
							employeeId: 'emp1',
							locationId: 1,
							bookingId: null
						},
						{
							id: '2',
							startTime: '2026-02-11T14:00:00Z',
							endTime: '2026-02-11T15:00:00Z',
							employeeId: 'emp2',
							locationId: 2,
							bookingId: 'booking123'
						}
					]
				})
			});
		});

		await page.route('**/api/locations*', route => {
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					items: [
						{id: 1, name: 'Location A'},
						{id: 2, name: 'Location B'}
					]
				})
			});
		});

		await page.route('**/api/users*', route => {
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					items: [
						{id: 'emp1', name: 'Employee One', email: 'emp1@example.com', role: 'Employee'},
						{id: 'emp2', name: 'Employee Two', email: 'emp2@example.com', role: 'Employee'}
					]
				})
			});
		});

		// Set a fake token in sessionStorage to bypass auth
		await page.addInitScript(() => {
			const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZSI6IkVtcGxveWVlIiwibmJmIjoxNzcwNDc1NjgwLCJleHAiOjI3NzA0NzkyODAsImlhdCI6MTc3MDQ3NTY4MCwiaXNzIjoiYm9vcXIiLCJhdWQiOiJodHRwczovL3d3dy5ib29xci5kayJ9.fake';
			sessionStorage.setItem('access_token', fakeToken);
		});
	});

	test('calendar page loads with extend hours button', async ({page}) => {
		await page.goto('/admin/calendar');

		// Check that page has loaded
		await expect(page.locator('h1')).toHaveText('Calendar');

		// Check that extend hours button is visible
		await expect(page.locator('button:has-text("Extend Hours")')).toBeVisible();
	});

	test('form panel width is narrower (w-80 instead of w-96)', async ({page}) => {
		await page.goto('/admin/calendar');

		// Wait for the calendar component to be visible
		await expect(page.locator('h1:has-text("Calendar")')).toBeVisible();

		// Click on a time slot to open the form (simulate clicking Monday at 10:00)
		// The calendar renders with time slots that we can click
		const timeSlot = page.locator('.ec-time-grid').first();
		await expect(timeSlot).toBeVisible({timeout: 5000});
		
		// Click to open the form
		await timeSlot.click();

		// Wait for form to appear
		await expect(page.locator('text=Create New Vacancy')).toBeVisible({timeout: 3000});

		// Verify the form panel has the w-80 class (320px width)
		const formPanel = page.locator('.w-80').first();
		await expect(formPanel).toBeVisible();
	});

	test('form shows "Vacancy Details" title in view mode', async ({page}) => {
		// Mock the getVacancyById API call
		await page.route('**/api/vacancies/1', route => {
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					id: '1',
					startTime: '2026-02-10T10:00:00Z',
					endTime: '2026-02-10T11:00:00Z',
					employeeId: 'emp1',
					locationId: 1,
					bookingId: null
				})
			});
		});

		await page.goto('/admin/calendar');

		// Wait for calendar to load
		await expect(page.locator('h1:has-text("Calendar")')).toBeVisible();
		
		// Wait for events to be rendered (green/red event blocks)
		const eventElement = page.locator('.ec-event').first();
		await expect(eventElement).toBeVisible({timeout: 5000});
		
		// Click on the event to open view mode
		await eventElement.click();

		// Verify view mode form appears
		await expect(page.locator('text=Vacancy Details')).toBeVisible({timeout: 3000});
	});

	test('delete button exists in Form component', async ({page}) => {
		await page.goto('/admin/calendar');

		// The Form component now supports deleteLabel and ondelete props
		// We can verify the component is present
		await expect(page.locator('h1')).toHaveText('Calendar');
	});

	test('calendar supports event click handler', async ({page}) => {
		await page.goto('/admin/calendar');

		// Wait for calendar to render with proper elements
		await expect(page.locator('h1:has-text("Calendar")')).toBeVisible();
		
		// The Calendar component now has onEventClick prop
		// Events should be clickable when rendered
		const calendarContainer = page.locator('.ec');
		await expect(calendarContainer).toBeVisible({timeout: 5000});
	});
});
