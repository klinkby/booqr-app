<script>
	import { auth, Calendar, VacancyForm, apiErrorMessage } from '$lib';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { DateUtils } from '$lib/dateUtils.js';
	import { usePlanData } from './planData.svelte.js';

	// Vacancy/location/employee data + mutations owned by the svelte-query hook.
	// The range is read live from the URL inside the thunk so week navigation refetches.
	const plan = usePlanData(() => ({
		from: page.url.searchParams.get('from'),
		to: page.url.searchParams.get('to'),
	}));

	// Form state
	let showForm = $state(false);
	let formMode = $state('create');
	let selectedVacancyId = $state(null);
	let formData = $state({
		date: '',
		startTime: '',
		endTime: '',
		employeeId: '',
		locationId: '',
	});
	let formLoading = $state(false);
	let formError = $state(null);

	// Live preview event shown on calendar while create-form is open
	const previewEvent = $derived.by(() => {
		if (!showForm || formMode !== 'create' || !formData.date || !formData.startTime || !formData.endTime) return null;
		return {
			id: 'preview',
			start: formData.date + 'T' + formData.startTime,
			end: formData.date + 'T' + formData.endTime,
			title: 'New Vacancy',
			startEditable: true,
			durationEditable: true,
			classNames: ['!bg-gray-300', '!text-gray-600', '!border-gray-400', '!border-dashed'],
		};
	});

	// Transform API vacancies to event calendar format, reactively derived from loaded data
	const calendarEvents = $derived.by(() => {
		const vacancyEvents = plan.vacancies.map((vacancy) => ({
			id: vacancy.id,
			start: DateUtils.utcToLocalIso(vacancy.startTime),
			end: DateUtils.utcToLocalIso(vacancy.endTime),
			title: vacancy.bookingId
				? 'Booked'
				: [
						plan.employees.find((e) => e.id === vacancy.employeeId)?.name,
						plan.locations.find((l) => l.id === vacancy.locationId)?.name,
					]
						.filter(Boolean)
						.join(' @ ') || 'Available',
			startEditable: false,
			durationEditable: false,
			classNames: vacancy.bookingId
				? ['!bg-red-500', '!text-white', '!border-red-600']
				: ['!bg-green-500', '!text-white', '!border-green-600'],
			extendedProps: {
				employeeId: vacancy.employeeId,
				locationId: vacancy.locationId,
				bookingId: vacancy.bookingId,
			},
		}));
		return previewEvent ? [...vacancyEvents, previewEvent] : vacancyEvents;
	});

	// Week navigation: update URL params so the load function re-fetches for the new range
	function handleDatesChange(info) {
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- Query params only; resolve() not needed for relative paths without route change
		goto(`?from=${info.start.toISOString()}&to=${info.end.toISOString()}`, {
			replaceState: true,
			keepFocus: true,
			noScroll: true,
		});
	}

	function handleDateClick(info) {
		const startDate = new Date(info.date);
		const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

		formMode = 'create';
		selectedVacancyId = null;
		formData = {
			date: DateUtils.toLocalDate(startDate),
			startTime: DateUtils.toLocalTime(startDate),
			endTime: DateUtils.toLocalTime(endDate),
			employeeId: auth.userId || '',
			locationId: plan.locations[0]?.id || '',
		};
		formError = null;
		showForm = true;
	}

	async function handleEventClick(info) {
		if (info.event.id === 'preview') return;

		formMode = 'view';
		selectedVacancyId = info.event.id;
		formError = null;
		formLoading = true;
		showForm = true;

		try {
			const vacancy = await plan.getVacancy(info.event.id);
			const startDate = new Date(vacancy.startTime);
			const endDate = new Date(vacancy.endTime);

			formData = {
				date: DateUtils.toLocalDate(startDate),
				startTime: DateUtils.toLocalTime(startDate),
				endTime: DateUtils.toLocalTime(endDate),
				employeeId: vacancy.employeeId?.toString() || '',
				locationId: vacancy.locationId?.toString() || '',
			};
		} catch (err) {
			formError = apiErrorMessage(err);
		} finally {
			formLoading = false;
		}
	}

	async function handleFormSubmit() {
		formError = null;
		formLoading = true;

		try {
			await plan.addVacancy({
				employeeId: formData.employeeId || null,
				locationId: Number(formData.locationId),
				startTime: new Date(formData.date + 'T' + formData.startTime).toISOString(),
				endTime: new Date(formData.date + 'T' + formData.endTime).toISOString(),
			});
			showForm = false;
		} catch (err) {
			formError = apiErrorMessage(err);
		} finally {
			formLoading = false;
		}
	}

	function handleFormCancel() {
		showForm = false;
		formError = null;
	}

	function handleEventResize(info) {
		if (info.event.id === 'preview') {
			formData.endTime = DateUtils.toLocalTime(info.event.end);
		}
	}

	function handleEventDrop(info) {
		if (info.event.id === 'preview') {
			formData.date = DateUtils.toLocalDate(info.event.start);
			formData.startTime = DateUtils.toLocalTime(info.event.start);
			formData.endTime = DateUtils.toLocalTime(info.event.end);
		}
	}

	async function handleDelete() {
		if (!selectedVacancyId) return;

		formError = null;
		formLoading = true;

		try {
			await plan.deleteVacancy(selectedVacancyId);
			showForm = false;
		} catch (err) {
			formError = apiErrorMessage(err);
		} finally {
			formLoading = false;
		}
	}
</script>

<div class="container mx-auto max-w-7xl">
	{#if plan.error}
		<div role="alert" class="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
			{apiErrorMessage(plan.error, 'Failed to load vacancies. Please try again.')}
		</div>
	{/if}

	<div class="flex gap-6">
		<div class="flex-1 min-w-0" aria-busy={plan.isLoading}>
			<Calendar
				events={calendarEvents}
				onDatesChange={handleDatesChange}
				onDateClick={handleDateClick}
				onEventClick={handleEventClick}
				onEventResize={handleEventResize}
				onEventDrop={handleEventDrop}
			/>
		</div>

		{#if showForm}
			<div class="w-80 shrink-0">
				<VacancyForm
					mode={formMode}
					date={formData.date}
					bind:startTime={formData.startTime}
					bind:endTime={formData.endTime}
					bind:locationId={formData.locationId}
					bind:employeeId={formData.employeeId}
					locations={plan.locations}
					employees={plan.employees}
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
