<script>
	import { auth, BookingForm, Calendar, apiErrorMessage } from '$lib';
	import { BookingService } from '$lib/api';
	import { invokeApi } from '$lib/invokeApi';
	import { goto, invalidate } from '$app/navigation';
	import { page } from '$app/stores';
	import { DateUtils } from '$lib/dateUtils.js';
	import { bookingCache } from './bookingCache.js';

	let { data } = $props();

	let showForm = $state(false);
	let formMode = $state('book');
	let selectedVacancy = $state(null);
	let selectedBooking = $state(null);
	let formServiceId = $state('');
	let formStartTime = $state('');
	let formError = $state(null);
	let formLoading = $state(false);

	const ownBookingClasses = ['!bg-green-700', '!text-white', '!border-green-500'];
	const availableClasses = ['!bg-gray-800', '!text-white', '!border-gray-500'];

	const vacancyMap = $derived(new Map(data.vacancies.map((v) => [String(v.id), v])));
	const employeeMap = $derived(new Map(data.employees.map((e) => [String(e.id), e])));
	const locationMap = $derived(new Map(data.locations.map((l) => [String(l.id), l])));

	const urlFrom = $derived($page.url.searchParams.get('from'));
	const urlTo = $derived($page.url.searchParams.get('to'));

	const selectedEmployeeIdStr = $derived(selectedVacancy ? String(selectedVacancy.employeeId) : null);
	const servicesByEmployeeMap = $derived.by(() => {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- Map is ephemeral and reconstructed on each derivation; not shared mutable state
		const map = new Map();
		for (const service of data.services) {
			for (const empId of service.employees || []) {
				const key = String(empId);
				if (!map.has(key)) map.set(key, []);
				map.get(key).push(service);
			}
		}
		return map;
	});

	const filteredServices = $derived(
		selectedEmployeeIdStr ? (servicesByEmployeeMap.get(selectedEmployeeIdStr) ?? []) : [],
	);

	const calendarEvents = $derived.by(() => {
		const vacancyEvents = data.vacancies.map((v) => {
			const employeeName = employeeMap.get(String(v.employeeId))?.name;
			const locationName = locationMap.get(String(v.locationId))?.name;
			const title =
				employeeName && locationName
					? `${employeeName} @ ${locationName}`
					: employeeName || locationName || 'Available';
			return {
				id: v.id,
				start: DateUtils.utcToLocalIso(v.startTime),
				end: DateUtils.utcToLocalIso(v.endTime),
				title,
				startEditable: false,
				durationEditable: false,
				classNames: availableClasses,
			};
		});
		const bookingEvents = data.bookings.map((b) => ({
			id: `booking-${b.id}`,
			start: DateUtils.utcToLocalIso(b.startTime),
			end: DateUtils.utcToLocalIso(b.endTime),
			title: 'My Booking',
			startEditable: false,
			durationEditable: false,
			classNames: ownBookingClasses,
		}));
		return [...vacancyEvents, ...bookingEvents];
	});

	function handleDatesChange(info) {
		const from = info.start.toISOString();
		const to = info.end.toISOString();
		if (urlFrom === from && urlTo === to) return;
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- Query params only; resolve() not needed for relative paths without route change
		goto(`?from=${from}&to=${to}`, { replaceState: true, keepFocus: true, noScroll: true });
	}

	function handleEventClick(info) {
		const eventId = String(info.event.id);

		if (eventId.startsWith('booking-')) {
			const bookingId = eventId.slice('booking-'.length);
			const booking = data.bookings.find((b) => String(b.id) === bookingId);
			if (!booking) return;
			selectedVacancy = null;
			selectedBooking = booking;
			formMode = 'view';
			formServiceId = '';
			formStartTime = DateUtils.toLocalTime(new Date(booking.startTime));
			formError = null;
			showForm = true;
			return;
		}

		const vacancy = vacancyMap.get(eventId);
		if (!vacancy) return;

		if (!auth.isLoggedIn) {
			const returnUrl = $page.url.pathname + $page.url.search;
			// eslint-disable-next-line svelte/no-navigation-without-resolve -- Dynamic URL already fully resolved from query params; wrapping in resolve() would be redundant
			goto(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
			return;
		}

		selectedVacancy = vacancy;
		selectedBooking = null;
		formMode = 'book';
		formServiceId = '';
		formStartTime = DateUtils.toLocalTime(new Date(vacancy.startTime));
		formError = null;
		showForm = true;
	}

	async function handleSubmit() {
		formError = null;
		formLoading = true;
		try {
			await invokeApi(() =>
				BookingService.addBooking({
					vacancyId: selectedVacancy.id,
					serviceId: formServiceId,
					startTime: new Date(
						DateUtils.toLocalDate(new Date(selectedVacancy.startTime)) + 'T' + formStartTime,
					).toISOString(),
				}),
			);
			await refreshBookingData();
		} catch (err) {
			if (err.status === 409) {
				formError = 'That appointment has already been taken. Please choose another time.';
				formStartTime = '';
				bookingCache.purgeVacancies(urlFrom, urlTo);
				await invalidate('app:vacancies');
			} else {
				formError = apiErrorMessage(err);
			}
		} finally {
			formLoading = false;
		}
	}

	async function handleDelete() {
		if (!selectedBooking) return;
		formError = null;
		formLoading = true;
		try {
			await invokeApi(() => BookingService.deleteBooking(selectedBooking.id));
			await refreshBookingData();
		} catch (err) {
			formError = apiErrorMessage(err);
		} finally {
			formLoading = false;
		}
	}

	function handleCancel() {
		showForm = false;
		formError = null;
	}

	async function refreshBookingData() {
		showForm = false;
		bookingCache.purgeVacancies(urlFrom, urlTo);
		await invalidate('app:vacancies');
		await invalidate('app:bookings');
	}
</script>

<div class="container mx-auto max-w-7xl">
	<div class="flex gap-6">
		<div class="flex-1 min-w-0">
			<Calendar events={calendarEvents} onDatesChange={handleDatesChange} onEventClick={handleEventClick} />
		</div>

		{#if showForm}
			<aside class="w-80 shrink-0" aria-label="Booking form">
				<BookingForm
					mode={formMode}
					vacancy={selectedVacancy}
					booking={selectedBooking}
					services={filteredServices}
					employees={data.employees}
					locations={data.locations}
					bind:serviceId={formServiceId}
					bind:startTime={formStartTime}
					error={formError}
					loading={formLoading}
					onsubmit={handleSubmit}
					oncancel={handleCancel}
					ondelete={handleDelete}
				/>
			</aside>
		{/if}
	</div>
</div>
