<script>
	import { VacancyService } from '$lib/api';
	import { auth, Calendar, VacancyForm, apiErrorMessage } from '$lib';
	import { invokeApi } from '$lib/invokeApi';
	import { goto, invalidate } from '$app/navigation';
	import { page } from '$app/stores';
	import { vacancyCache } from './vacancyCache.js';
	import { DateUtils } from '$lib/dateUtils.js';

	let { data } = $props();

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
		const vacancyEvents = data.vacancies.map((vacancy) => ({
			id: vacancy.id,
			start: DateUtils.utcToLocalIso(vacancy.startTime),
			end: DateUtils.utcToLocalIso(vacancy.endTime),
			title: vacancy.bookingId
				? 'Booked'
				: [
						data.employees.find((e) => e.id === vacancy.employeeId)?.name,
						data.locations.find((l) => l.id === vacancy.locationId)?.name,
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
			locationId: data.locations[0]?.id || '',
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
			const vacancy = await invokeApi(() => VacancyService.getVacancyById(info.event.id));
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
			await invokeApi(() =>
				VacancyService.addVacancy({
					employeeId: formData.employeeId || null,
					locationId: Number(formData.locationId),
					startTime: new Date(formData.date + 'T' + formData.startTime).toISOString(),
					endTime: new Date(formData.date + 'T' + formData.endTime).toISOString(),
				}),
			);
			showForm = false;
			vacancyCache.purge($page.url.searchParams.get('from'), $page.url.searchParams.get('to'));
			await invalidate('app:vacancies');
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
			await invokeApi(() => VacancyService.deleteVacancy(selectedVacancyId));
			showForm = false;
			vacancyCache.purge($page.url.searchParams.get('from'), $page.url.searchParams.get('to'));
			await invalidate('app:vacancies');
		} catch (err) {
			formError = apiErrorMessage(err);
		} finally {
			formLoading = false;
		}
	}
</script>

<div class="container mx-auto px-4 py-8 max-w-7xl">
	<h1 class="text-3xl font-bold mb-6">Calendar</h1>

	<div class="flex gap-6">
		<div class="flex-1 min-w-0">
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
					locations={data.locations}
					employees={data.employees}
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
