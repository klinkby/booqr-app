<script>
	import { VacancyService } from '$lib/api';
	import { Calendar } from '$lib';
	import { invokeApi } from '$lib/invokeApi';

	let events = $state([]);
	let loading = $state(false);
	let error = $state(null);

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
		fetchVacancies(info.start, info.end);
	}
</script>

<div class="container mx-auto px-4 py-8 max-w-7xl">
	<h1 class="text-3xl font-bold mb-6">Calendar</h1>

	{#if error}
		<div role="alert" class="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-md">
			{error}
		</div>
	{/if}

	<Calendar {events} onDatesChange={handleDatesChange} />
</div>