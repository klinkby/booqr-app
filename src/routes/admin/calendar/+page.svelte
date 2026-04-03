<script>
	import {LocationService, UserService, VacancyService} from '$lib/api';
	import {auth, Calendar, VacancyForm} from '$lib';
	import {invokeApi} from '$lib/invokeApi';
	import {onMount} from 'svelte';

	let calendarRef;

	// Form state for creating/viewing vacancies
	let showForm = $state(false);
	let formMode = $state('create');
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
			classNames: ['!bg-gray-300', '!text-gray-600', '!border-gray-400', '!border-dashed']
		};
	});

	// Dropdowns data (shared between Calendar and VacancyForm)
	let locations = $state([]);
	let employees = $state([]);

	onMount(async () => {
		try {
			const [locationsRes, usersRes] = await Promise.all([
				invokeApi(() => LocationService.getLocations()),
				invokeApi(() => UserService.getUsers(undefined, 'Employee'))
			]);
			locations = locationsRes.items;
			employees = usersRes.items;
		} catch {
			// Silently fail — form just won't have dropdown options
		}
	});

	function pad(n) {
		return String(n).padStart(2, '0');
	}

	function toLocalDate(d) {
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
	}

	function toLocalTime(d) {
		return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
	}

	function handleDateClick(info) {
		const startDate = new Date(info.date);
		const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

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
				date: toLocalDate(startDate),
				startTime: toLocalTime(startDate),
				endTime: toLocalTime(endDate),
				employeeId: vacancy.employeeId?.toString() || '',
				locationId: vacancy.locationId?.toString() || ''
			};
		} catch (err) {
			formError = err.message || 'Failed to load vacancy details';
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
					endTime: new Date(formData.date + 'T' + formData.endTime).toISOString()
				})
			);
			showForm = false;
			calendarRef.refresh();
		} catch (err) {
			formError = err.message || 'Failed to create vacancy';
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

	async function handleDelete() {
		if (!selectedVacancyId) return;

		formError = null;
		formLoading = true;

		try {
			await invokeApi(() => VacancyService.deleteVacancy(selectedVacancyId));
			showForm = false;
			calendarRef.refresh();
		} catch (err) {
			formError = err.message || 'Failed to delete vacancy';
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
				bind:this={calendarRef}
				{locations}
				{employees}
				{previewEvent}
				ondateclick={handleDateClick}
				oneventclick={handleEventClick}
				oneventresize={handleEventResize}
				oneventdrop={handleEventDrop}
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
