<script>
	import { auth, Calendar, VacancyForm, apiErrorMessage } from '$lib';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { DateUtils } from '$lib/dateUtils.js';
	import { usePlanData } from './planData.svelte.js';
	import { m } from '$lib/paraglide/messages.js';

	// Vacancy/location/employee data + mutations owned by the svelte-query hook.
	// The range is read live from the URL inside the thunk so week navigation refetches.
	// The selectedEmployeeId is passed as a second thunk to control the appointments overlay.
	// Default to the logged-in employee; reconciled against the loaded roster below.
	let selectedEmployeeId = $state(auth.userId || '');

	const plan = usePlanData(
		() => ({
			from: page.url.searchParams.get('from'),
			to: page.url.searchParams.get('to'),
		}),
		() => selectedEmployeeId,
	);

	// Once the employee roster loads, keep the <select> and selectedEmployeeId in
	// sync: if the current value isn't an option (e.g. auth.userId isn't in the
	// roster), fall back to the first employee so the bound value always matches a
	// rendered <option> — mirrors the locations[0] default used for the vacancy form.
	$effect(() => {
		const employees = plan.employees;
		if (employees.length > 0 && !employees.some((e) => e.id === selectedEmployeeId)) {
			selectedEmployeeId = employees[0].id;
		}
	});

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
			title: m.newVacancy(),
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
				? m.booked()
				: [
						plan.employees.find((e) => e.id === vacancy.employeeId)?.name,
						plan.locations.find((l) => l.id === vacancy.locationId)?.name,
					]
						.filter(Boolean)
						.join(' @ ') || m.available(),
			startEditable: false,
			durationEditable: false,
			classNames: vacancy.bookingId
				? ['!bg-red-500', '!text-white', '!border-red-600']
				: ['!bg-green-500', '!text-white', '!border-green-600'],
			extendedProps: {
				eventType: 'vacancy',
				employeeId: vacancy.employeeId,
				locationId: vacancy.locationId,
				bookingId: vacancy.bookingId,
			},
		}));
		const events = [...vacancyEvents, ...plan.appointmentEvents];
		return previewEvent ? [...events, previewEvent] : events;
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
		// Appointments are display-only on this calendar (no vacancy edit panel).
		if (info.event.extendedProps?.eventType === 'appointment') return;

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
			{apiErrorMessage(plan.error, m.errorLoadVacancies())}
		</div>
	{/if}

	<div class="flex gap-6">
		<div class="flex-1 min-w-0 relative" aria-busy={plan.isLoading}>
			<!-- Employee selector overlaid at the top-right of the calendar's toolbar
			     row, vertically centred against the < > today buttons. The calendar
			     toolbar below reserves right padding (pr-48) so its centred title
			     can't slide under this control on narrow widths. -->
			<div class="absolute right-0 top-0 z-10 flex items-center min-h-[2.375rem] max-w-[11rem]">
				<label for="plan-employee-select" class="sr-only">{m.selectEmployeeToView()}</label>
				<select
					id="plan-employee-select"
					bind:value={selectedEmployeeId}
					class="w-full truncate rounded-md border border-gray-300 bg-white py-1 pl-2 pr-8 text-sm"
				>
					{#each plan.employees as e (e.id)}
						<option value={e.id}>{e.name}</option>
					{/each}
				</select>
			</div>
			<div class="[&_.ec-toolbar]:pr-48">
				<Calendar
					events={calendarEvents}
					onDatesChange={handleDatesChange}
					onDateClick={handleDateClick}
					onEventClick={handleEventClick}
					onEventResize={handleEventResize}
					onEventDrop={handleEventDrop}
				/>
			</div>
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
