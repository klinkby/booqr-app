<script>
	import { Form } from '$lib';
	import { DateUtils } from '$lib/dateUtils.js';

	let {
		mode = 'book', // 'book' | 'view'
		vacancy = null, // original vacancy object with UTC times
		booking = null, // MyBooking object (view mode)
		services = [], // filtered to vacancy's employee
		employees = [],
		locations = [],
		serviceId = $bindable(''),
		startTime = $bindable(''),
		error = null,
		loading = false,
		onsubmit,
		oncancel,
		ondelete = undefined,
	} = $props();

	function parseDurationMinutes(duration) {
		if (!duration) return 0;
		const parts = duration.split(':');
		if (parts.length >= 2) return parseInt(parts[0]) * 60 + parseInt(parts[1]);
		return 0;
	}

	const isReadonly = $derived(mode === 'view');

	const selectedService = $derived(services.find((s) => String(s.id) === serviceId));
	const serviceDurationMinutes = $derived(selectedService ? parseDurationMinutes(selectedService.duration) : 0);

	const vacancyDate = $derived(vacancy ? DateUtils.toLocalDate(new Date(vacancy.startTime)) : '');
	const vacancyStartTime = $derived(vacancy ? DateUtils.toLocalTime(new Date(vacancy.startTime)) : '');
	const vacancyEndTime = $derived(vacancy ? DateUtils.toLocalTime(new Date(vacancy.endTime)) : '');

	const employeeName = $derived(
		employees.find((e) => String(e.id) === String(vacancy?.employeeId ?? booking?.employeeId))?.name ?? '',
	);
	const locationName = $derived(
		locations.find((l) => String(l.id) === String(vacancy?.locationId ?? booking?.locationId))?.name ?? '',
	);

	const formattedDate = $derived.by(() => {
		const dateStr = isReadonly
			? booking?.startTime
				? DateUtils.toLocalDate(new Date(booking.startTime))
				: ''
			: vacancyDate;
		return dateStr
			? new Date(dateStr + 'T00:00').toLocaleDateString(undefined, {
					weekday: 'long',
					year: 'numeric',
					month: 'long',
					day: 'numeric',
				})
			: '';
	});

	const timeError = $derived.by(() => {
		if (isReadonly || !serviceId || !startTime || !vacancy) return null;
		const start = new Date(vacancyDate + 'T' + startTime);
		const vacStart = new Date(vacancyDate + 'T' + vacancyStartTime);
		if (start < vacStart) return 'Start time must be within the vacancy time slot';
		const end = new Date(start.getTime() + serviceDurationMinutes * 60000);
		const vacEnd = new Date(vacancyDate + 'T' + vacancyEndTime);
		if (end > vacEnd) return 'Service does not fit within the vacancy time slot';
		return null;
	});

	const canDelete = $derived(isReadonly && !!ondelete && !!booking?.startTime);

	const bookingTimeDisplay = $derived.by(() => {
		if (!booking?.startTime) return '';
		const start = DateUtils.toLocalTime(new Date(booking.startTime));
		const end = booking.endTime ? DateUtils.toLocalTime(new Date(booking.endTime)) : '';
		return end ? `${start} – ${end}` : start;
	});
</script>

<div class="sticky top-4 p-6 bg-gray-50 border border-gray-200 rounded-lg">
	<h2 class="text-xl font-semibold mb-4">
		{isReadonly ? 'My Appointment' : 'Book Appointment'}
	</h2>

	<Form
		error={timeError || error}
		legend={isReadonly ? 'View appointment' : 'Book appointment'}
		{loading}
		onsubmit={(e) => {
			if (isReadonly) {
				oncancel();
			} else if (!timeError) {
				onsubmit(e);
			}
		}}
		oncancel={isReadonly ? undefined : oncancel}
		submitLabel={isReadonly ? 'Close' : 'Book'}
		deleteLabel={canDelete ? 'Cancel Appointment' : undefined}
		ondelete={canDelete ? ondelete : undefined}
	>
		{#if formattedDate}
			<p class="text-sm font-medium text-gray-700">{formattedDate}</p>
		{/if}

		{#if !isReadonly && vacancy}
			<p class="text-sm text-gray-600">
				Available: {vacancyStartTime} – {vacancyEndTime}{#if employeeName}
					with {employeeName}{/if}{#if locationName}
					at {locationName}{/if}
			</p>

			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1" for="serviceId"> Service </label>
				<select
					bind:value={serviceId}
					class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
					id="serviceId"
					name="serviceId"
					required
				>
					<option value="" disabled selected>Select a service</option>
					{#each services as service (service.id)}
						<option value={String(service.id)}>{service.name}</option>
					{/each}
				</select>
			</div>

			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1" for="bookingStartTime"> Start Time </label>
				<input
					bind:value={startTime}
					class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
					id="bookingStartTime"
					name="startTime"
					required
					step="300"
					type="time"
					min={vacancyStartTime}
					max={vacancyEndTime}
				/>
			</div>
		{:else if isReadonly && booking}
			<dl class="space-y-2 text-sm">
				{#if booking.serviceName}
					<div>
						<dt class="font-medium text-gray-700">Service</dt>
						<dd class="text-gray-600">{booking.serviceName}</dd>
					</div>
				{/if}
				{#if bookingTimeDisplay}
					<div>
						<dt class="font-medium text-gray-700">Time</dt>
						<dd class="text-gray-600">{bookingTimeDisplay}</dd>
					</div>
				{/if}
				{#if employeeName}
					<div>
						<dt class="font-medium text-gray-700">Employee</dt>
						<dd class="text-gray-600">{employeeName}</dd>
					</div>
				{/if}
				{#if locationName}
					<div>
						<dt class="font-medium text-gray-700">Location</dt>
						<dd class="text-gray-600">{locationName}</dd>
					</div>
				{/if}
			</dl>
		{/if}
	</Form>
</div>
