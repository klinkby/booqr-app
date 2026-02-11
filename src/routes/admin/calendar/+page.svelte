<script>
	import {LocationService, UserService, VacancyService} from '$lib/api';
	import {auth, Calendar, VacancyForm} from '$lib';
	import {invokeApi} from '$lib/invokeApi';
	import {onMount} from 'svelte';

	let events = $state([]);
	let loading = $state(false);
	let error = $state(null);

	// Calendar view settings
	let slotMaxTime = $state('18:00:00'); // Default end time
	let expandCount = $state(0); // Track number of expansions (max 2)

	// Track current date range for refreshing
	let currentDateRange = $state({start: null, end: null});

	// Form state for creating vacancies
	let showForm = $state(false);
	let formMode = $state('create'); // 'create' or 'view'
	let selectedVacancyId = $state(null);
	let formData = $state({
		date: '',
		startTime: '',
		endTime: '',
		employeeId: '',
		locationId: ''
	});
	let formLoading = $state(false);
	let formError = $state(null);

	// Live preview event shown on calendar while form is open
	const previewEvent = $derived.by(() => {
		if (!showForm || formMode !== 'create' || !formData.date || !formData.startTime || !formData.endTime) return null;
		return {
			id: 'preview',
			start: formData.date + 'T' + formData.startTime,
			end: formData.date + 'T' + formData.endTime,
			title: 'New Vacancy',
			startEditable: true,
			durationEditable: true,
			classNames: ['!bg-gray-300', '!text-gray-600', '!border-gray-400', '!border-dashed']
		};
	});
	const calendarEvents = $derived(previewEvent ? [...events, previewEvent] : events);

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
			employees = usersRes.items.filter(user => user.role === 'Employee' || user.role === 'Admin');
		} catch (err) {
			// Silently fail - form just won't have dropdown options
		}
	});

	/**
	 * Handle date/time click on calendar
	 * @param {object} info - Contains {date, dateStr, allDay, resource, jsEvent, view}
	 */
	function pad(n) {
		return String(n).padStart(2, '0');
	}

	function toLocalDate(d) {
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
	}

	function toLocalTime(d) {
		return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
	}

	function utcToLocalIso(utcString) {
		const d = new Date(utcString);
		return `${toLocalDate(d)}T${toLocalTime(d)}`;
	}

	function handleDateClick(info) {
		const startDate = new Date(info.date);
		const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // +1 hour

		formMode = 'create';
		selectedVacancyId = null;
		formData = {
			date: toLocalDate(startDate),
			startTime: toLocalTime(startDate),
			endTime: toLocalTime(endDate),
			employeeId: auth.userId || '',
			locationId: locations[0]?.id || ''
		};
		formError = null;
		showForm = true;
	}

	/**
	 * Handle event click on calendar - show details in read-only mode
	 * @param {object} info - Contains {event, jsEvent, view}
	 */
	async function handleEventClick(info) {
		// Ignore clicks on preview event
		if (info.event.id === 'preview') return;

		formMode = 'view';
		selectedVacancyId = info.event.id;
		formError = null;
		formLoading = true;
		showForm = true;

		try {
			const vacancy = await invokeApi(() => VacancyService.getVacancyById(info.event.id));
			const startDate = new Date(vacancy.startTime);
			const endDate = new Date(vacancy.endTime);

			formData = {
				date: toLocalDate(startDate),
				startTime: toLocalTime(startDate),
				endTime: toLocalTime(endDate),
				employeeId: vacancy.employeeId || '',
				locationId: vacancy.locationId?.toString() || ''
			};
		} catch (err) {
			formError = err.message || 'Failed to load vacancy details';
		} finally {
			formLoading = false;
		}
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
					startTime: new Date(formData.date + 'T' + formData.startTime).toISOString(),
					endTime: new Date(formData.date + 'T' + formData.endTime).toISOString()
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
	 * Handle vacancy deletion
	 */
	async function handleDelete() {
		if (!selectedVacancyId) return;

		formError = null;
		formLoading = true;

		try {
			await invokeApi(() => VacancyService.deleteVacancy(selectedVacancyId));

			// Close form and refresh calendar events
			showForm = false;
			// Re-fetch vacancies for current date range
			if (currentDateRange.start && currentDateRange.end) {
				await fetchVacancies(currentDateRange.start, currentDateRange.end);
			}
		} catch (err) {
			formError = err.message || 'Failed to delete vacancy';
		} finally {
			formLoading = false;
		}
	}

	function handleEventResize(info) {
		if (info.event.id === 'preview') {
			formData.endTime = toLocalTime(info.event.end);
		}
	}

	function handleEventDrop(info) {
		if (info.event.id === 'preview') {
			formData.date = toLocalDate(info.event.start);
			formData.startTime = toLocalTime(info.event.start);
			formData.endTime = toLocalTime(info.event.end);
		}
	}

	/**
	 * Transform API CalendarEvent to Event Calendar format
	 * @param {import('$lib/api').CalendarEvent} vacancy
	 */
	function transformVacancyToEvent(vacancy) {
		return {
			id: vacancy.id,
			start: utcToLocalIso(vacancy.startTime),
			end: utcToLocalIso(vacancy.endTime),
			title: vacancy.bookingId ? 'Booked' : 'Available',
			startEditable: false, // Saved events should not be draggable
			durationEditable: false, // Saved events should not be resizable
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
		currentDateRange = {start: info.start, end: info.end};
		fetchVacancies(info.start, info.end);
	}

	/**
	 * Expand calendar view by 6 hours (max 2 times)
	 */
	function expandCalendar() {
		if (expandCount < 2) {
			expandCount++;
			const currentHour = parseInt(slotMaxTime.split(':')[0]);
			const newHour = currentHour + 6;
			// Cap at midnight (24:00 or 00:00 next day)
			slotMaxTime = newHour >= 24 ? '24:00:00' : `${newHour.toString().padStart(2, '0')}:00:00`;
		}
	}
</script>

<div class="container mx-auto px-4 py-8 max-w-7xl">
	<div class="flex justify-between items-center mb-6">
		<h1 class="text-3xl font-bold">Calendar</h1>
		{#if expandCount < 2}
			<button
				onclick={expandCalendar}
				class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
			>
				Extend Hours (+6h)
			</button>
		{/if}
	</div>

	{#if error}
		<div role="alert" aria-live="assertive" class="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-md">
			{error}
		</div>
	{/if}

	<div class="flex gap-6">
		<!-- Calendar section -->
		<div class="flex-1 min-w-0">
			<Calendar
				events={calendarEvents}
				{slotMaxTime}
				onDateClick={handleDateClick}
				onEventClick={handleEventClick}
				onDatesChange={handleDatesChange}
				onEventResize={handleEventResize}
				onEventDrop={handleEventDrop}
			/>
		</div>

		<!-- Form panel -->
		{#if showForm}
			<div class="w-80 shrink-0">
				<VacancyForm
					mode={formMode}
					date={formData.date}
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
					ondelete={formMode === 'view' ? handleDelete : undefined}
				/>
			</div>
		{/if}
	</div>
</div>
