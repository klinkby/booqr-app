<script>
	import { VacancyService, LocationService, UserService } from '$lib/api';
	import { Calendar, VacancyForm, auth } from '$lib';
	import { invokeApi } from '$lib/invokeApi';
	import { onMount } from 'svelte';

	let events = $state([]);
	let loading = $state(false);
	let error = $state(null);

	// Track current date range for refreshing
	let currentDateRange = $state({ start: null, end: null });

	// Form state for creating vacancies
	let showForm = $state(false);
	let formData = $state({
		startTime: '',
		endTime: '',
		employeeId: '',
		locationId: ''
	});
	let formLoading = $state(false);
	let formError = $state(null);

	// Dropdowns data
	let locations = $state([]);
	let employees = $state([]);

	// Load locations and employees on mount (for form dropdowns)
	onMount(async () => {
		try {
			const [locationsRes, usersRes] = await Promise.all([
				invokeApi(() => LocationService.getLocations(0, 100)),
				invokeApi(() => UserService.getUsers(0, 100))
			]);
			locations = locationsRes.items;
			// Filter only employees (role = 'Employee')
			employees = usersRes.items.filter(user => user.role === 'Employee');
		} catch (err) {
			// Silently fail - form just won't have dropdown options
		}
	});

	/**
	 * Handle date/time click on calendar
	 * @param {object} info - Contains {date, dateStr, allDay, resource, jsEvent, view}
	 */
	function handleDateClick(info) {
		// Calculate default end time (1 hour after start)
		const startDate = new Date(info.date);
		const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // +1 hour

		formData = {
			startTime: startDate.toISOString().slice(0, 16), // Format for datetime-local input
			endTime: endDate.toISOString().slice(0, 16),
			employeeId: auth.userId || '', // Default to current user
			locationId: locations[0]?.id || '' // Default to first location
		};
		formError = null;
		showForm = true;
	}

	/**
	 * Handle form submission to create vacancy
	 */
	async function handleFormSubmit() {
		formError = null;
		formLoading = true;

		try {
			await invokeApi(() =>
				VacancyService.addVacancy({
					employeeId: formData.employeeId || null,
					locationId: Number(formData.locationId),
					startTime: new Date(formData.startTime).toISOString(),
					endTime: new Date(formData.endTime).toISOString()
				})
			);

			// Close form and refresh calendar events
			showForm = false;
			// Re-fetch vacancies for current date range
			if (currentDateRange.start && currentDateRange.end) {
				await fetchVacancies(currentDateRange.start, currentDateRange.end);
			}
		} catch (err) {
			formError = err.message || 'Failed to create vacancy';
		} finally {
			formLoading = false;
		}
	}

	/**
	 * Handle form cancel
	 */
	function handleFormCancel() {
		showForm = false;
		formError = null;
	}

	/**
	 * Transform API CalendarEvent to Event Calendar format
	 * @param {import('$lib/api').CalendarEvent} vacancy
	 */
	function transformVacancyToEvent(vacancy) {
		return {
			id: vacancy.id,
			start: vacancy.startTime,
			end: vacancy.endTime,
			title: vacancy.bookingId ? 'Booked' : 'Available',
			classNames: vacancy.bookingId
				? ['!bg-red-500', '!text-white', '!border-red-600']
				: ['!bg-green-500', '!text-white', '!border-green-600'],
			extendedProps: {
				employeeId: vacancy.employeeId,
				locationId: vacancy.locationId,
				bookingId: vacancy.bookingId
			}
		};
	}

	/**
	 * Fetch vacancies for the given date range
	 * @param {Date} startDate
	 * @param {Date} endDate
	 */
	async function fetchVacancies(startDate, endDate) {
		loading = true;
		error = null;

		try {
			// Format dates as ISO strings for API
			const fromTime = startDate.toISOString();
			const toTime = endDate.toISOString();

			// Fetch all vacancies in the date range (Start=0, Num=100 for max results)
			const response = await invokeApi(() =>
				VacancyService.getVacancies(fromTime, toTime, 0, 100)
			);

			// Transform API events to calendar format
			events = response.items.map(transformVacancyToEvent);
		} catch (err) {
			error = err.message || 'Failed to load vacancies';
		} finally {
			loading = false;
		}
	}

	/**
	 * Handle date range changes from the calendar
	 * @param {object} info - Contains {start, end, startStr, endStr, view}
	 */
	function handleDatesChange(info) {
		currentDateRange = { start: info.start, end: info.end };
		fetchVacancies(info.start, info.end);
	}
</script>

<div class="container mx-auto px-4 py-8 max-w-7xl">
	<h1 class="text-3xl font-bold mb-6">Calendar</h1>

	{#if error}
		<div role="alert" aria-live="assertive" class="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-md">
			{error}
		</div>
	{/if}

	<div class="flex gap-6">
		<!-- Calendar section -->
		<div class="flex-1 min-w-0">
			<Calendar
				{events}
				onDatesChange={handleDatesChange}
				onDateClick={handleDateClick}
			/>
		</div>

		<!-- Form panel -->
		{#if showForm}
			<div class="w-96 shrink-0">
				<VacancyForm
					bind:startTime={formData.startTime}
					bind:endTime={formData.endTime}
					bind:locationId={formData.locationId}
					bind:employeeId={formData.employeeId}
					{locations}
					{employees}
					error={formError}
					loading={formLoading}
					onsubmit={handleFormSubmit}
					oncancel={handleFormCancel}
				/>
			</div>
		{/if}
	</div>
</div>
