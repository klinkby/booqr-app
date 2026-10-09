<script>
	import { auth, VacancyForm, apiErrorMessage } from '#lib';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { DateUtils } from '#lib/dateUtils.js';
	import { usePlanData } from './planData.svelte.js';
	import { m } from '#lib/paraglide/messages.js';
	import { alert, eventBooked, eventFree, eventPending, input } from '#lib/ui.js';

	// Lazy-load the calendar (and its heavy `@event-calendar/core` dependency) so it
	// splits into its own chunk instead of the shared bundle. Import the component's
	// own module directly — not the `#lib` barrel — or the bundler can't split it out.
	let Calendar = $state(null);
	onMount(async () => {
		Calendar = (await import('#lib/components/Calendar.svelte')).default;
	});

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
			classNames: eventPending,
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
			classNames: vacancy.bookingId ? eventBooked : eventFree,
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
		goto(`?from=${info.start.toISOString()}&to=${info.end.toISOString()}`, {
			replace: true,
			reset: false,
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
		<div role="alert" class="{alert} mb-4">
			{apiErrorMessage(plan.error, m.errorLoadVacancies())}
		</div>
	{/if}

	<div class="flex flex-col gap-6 lg:flex-row">
		<div class="flex-1 min-w-0 relative" aria-busy={plan.isLoading}>
			<!-- Employee selector: from `sm` up it overlays the top-right of the calendar's toolbar
			     row, vertically centred against the < > today buttons, and the toolbar reserves right
			     padding (sm:pr-48) so its centred title can't slide under it. On phones it sits above
			     the calendar, full width. -->
			<div
				class="mb-4 flex items-center sm:absolute sm:top-0 sm:right-0 sm:z-10 sm:mb-0 sm:min-h-[2.375rem] sm:max-w-[11rem]"
			>
				<label for="plan-employee-select" class="sr-only">{m.selectEmployeeToView()}</label>
				<select id="plan-employee-select" bind:value={selectedEmployeeId} class="{input} truncate pr-8">
					{#each plan.employees as e (e.id)}
						<option value={e.id}>{e.name}</option>
					{/each}
				</select>
			</div>
			<div class="sm:[&_.ec-toolbar]:pr-48">
				{#if Calendar}
					<Calendar
						events={calendarEvents}
						onDatesChange={handleDatesChange}
						onDateClick={handleDateClick}
						onEventClick={handleEventClick}
						onEventResize={handleEventResize}
						onEventDrop={handleEventDrop}
					/>
				{:else}
					<p role="status" class="p-4 text-sm text-gray-500">{m.loading()}</p>
				{/if}
			</div>
		</div>

		{#if showForm}
			<div class="w-full shrink-0 lg:w-80">
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
