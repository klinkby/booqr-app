<script>
	import {auth, BookingForm, Calendar} from '$lib';
	import {BookingService} from '$lib/api';
	import {invokeApi} from '$lib/invokeApi';
	import {goto, invalidate} from '$app/navigation';
	import {page} from '$app/stores';
	import {DateUtils} from '$lib/dateUtils.js';
	import {bookingCache} from './bookingCache.js';

	let {data} = $props();

	let showForm = $state(false);
	let formMode = $state('book');
	let selectedVacancy = $state(null);
	let selectedBooking = $state(null);
	let formServiceId = $state('');
	let formStartTime = $state('');
	let formError = $state(null);
	let formLoading = $state(false);

	const ownBookingClasses = ['!bg-indigo-500', '!text-white', '!border-indigo-600'];
	const availableClasses = ['!bg-green-500', '!text-white', '!border-green-600'];

	const ownBookingVacancyIds = $derived(new Set(data.bookings.map((b) => String(b.vacancyId))));
	const vacancyMap = $derived(new Map(data.vacancies.map((v) => [String(v.id), v])));
	const bookingMap = $derived(new Map(data.bookings.map((b) => [String(b.vacancyId), b])));
	const employeeMap = $derived(new Map(data.employees.map((e) => [String(e.id), e])));
	const locationMap = $derived(new Map(data.locations.map((l) => [String(l.id), l])));

	const urlFrom = $derived($page.url.searchParams.get('from'));
	const urlTo = $derived($page.url.searchParams.get('to'));

	const selectedEmployeeIdStr = $derived(selectedVacancy ? String(selectedVacancy.employeeId) : null);
	const servicesByEmployeeMap = $derived.by(() => {
		const map = new Map();
		for (const service of data.services) {
			for (const empId of (service.employees || [])) {
				const key = String(empId);
				if (!map.has(key)) map.set(key, []);
				map.get(key).push(service);
			}
		}
		return map;
	});

	const filteredServices = $derived(
		selectedEmployeeIdStr ? servicesByEmployeeMap.get(selectedEmployeeIdStr) ?? [] : []
	);

	const calendarEvents = $derived.by(() =>
		data.vacancies.map((v) => {
			const isOwnBooking = ownBookingVacancyIds.has(String(v.id));
			const employee = employeeMap.get(String(v.employeeId));
			const location = locationMap.get(String(v.locationId));
			const employeeName = employee?.name;
			const locationName = location?.name;
			let title;
			if (isOwnBooking) {
				title = 'My Booking';
			} else if (employeeName && locationName) {
				title = `${employeeName} @ ${locationName}`;
			} else {
				title = employeeName || locationName || 'Available';
			}
			return {
				id: v.id,
				start: DateUtils.utcToLocalIso(v.startTime),
				end: DateUtils.utcToLocalIso(v.endTime),
				title,
				startEditable: false,
				durationEditable: false,
				classNames: isOwnBooking ? ownBookingClasses : availableClasses,
				extendedProps: {vacancyId: v.id, employeeId: v.employeeId}
			};
		})
	);

	function handleDatesChange(info) {
		const from = info.start.toISOString();
		const to = info.end.toISOString();
		if (urlFrom === from && urlTo === to) return;
		goto(`?from=${from}&to=${to}`, {replaceState: true, keepFocus: true, noScroll: true});
	}

	function openForm(vacancy, isOwnBooking) {
		selectedVacancy = vacancy;
		selectedBooking = isOwnBooking ? bookingMap.get(String(vacancy.id)) ?? null : null;
		formMode = isOwnBooking ? 'view' : 'book';
		formServiceId = '';
		formStartTime = DateUtils.toLocalTime(new Date(vacancy.startTime));
		formError = null;
		showForm = true;
	}

	function handleEventClick(info) {
		const vacancyId = String(info.event.id);
		const vacancy = vacancyMap.get(vacancyId);
		if (!vacancy) return;

		const isOwnBooking = ownBookingVacancyIds.has(vacancyId);

		if (!isOwnBooking && !auth.isLoggedIn) {
			const returnUrl = $page.url.pathname + $page.url.search;
			goto(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
			return;
		}

		openForm(vacancy, isOwnBooking);
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
						DateUtils.toLocalDate(new Date(selectedVacancy.startTime)) + 'T' + formStartTime
					).toISOString()
				})
			);
			await refreshBookingData();
		} catch (err) {
			formError = err.message || 'Failed to create booking. Please try again.';
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
			formError = err.message || 'Failed to cancel booking. Please try again.';
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

<div class="container mx-auto px-4 py-8 max-w-7xl">
	<h1 class="text-3xl font-bold mb-6">Booking Calendar</h1>

	<div class="flex gap-6">
		<div class="flex-1 min-w-0">
			<Calendar
				events={calendarEvents}
				onDatesChange={handleDatesChange}
				onEventClick={handleEventClick}
			/>
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
