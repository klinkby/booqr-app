<script>
	import { BookingSummary, ChoiceList, MonthPicker, TimeSlotList, apiErrorMessage } from '$lib';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { DateUtils } from '$lib/dateUtils.js';
	import { useBookingData } from './bookingData.svelte.js';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime.js';

	const todayStr = DateUtils.toLocalDate(new Date());
	const currentMonthStr = todayStr.slice(0, 7);

	// `month` has no circular dependency, so it's declared before `booking` —
	// `useResourceQuery`'s thunk reads it synchronously at setup time.
	const effectiveMonth = $derived(page.url.searchParams.get('month') || currentMonthStr);

	// `locationId`/`employeeId` DO depend on `booking.allLocations`/
	// `booking.service` (declared below, after `booking` exists) — exposed as
	// getters rather than eager properties so building this object doesn't
	// evaluate them. Only `selectedVacancies`'s `$derived.by` (inside the
	// hook) ever reads `.locationId`/`.employeeId`, and by the time that runs
	// — after Svelte finishes this whole <script> block and starts rendering
	// — `effectiveLocationId`/`effectiveEmployeeId` below are long since
	// initialized. Eager properties here previously caused a real
	// "Cannot access before initialization" crash: `vacanciesQuery`'s thunk
	// destructures `{ serviceId, month }` only, but constructing the object
	// literal itself evaluates every property value up front.
	const booking = useBookingData(() => ({
		serviceId: page.params.serviceId,
		month: effectiveMonth,
		date: page.url.searchParams.get('date'),
		get locationId() {
			return effectiveLocationId;
		},
		get employeeId() {
			return effectiveEmployeeId;
		},
	}));

	// Step 2 ("Where?") is skipped when there's only one location — it's
	// auto-selected. Otherwise the URL's `?location=` decides it.
	const showLocationStep = $derived(booking.allLocations.length > 1 && !page.url.searchParams.get('location'));

	const effectiveLocationId = $derived.by(() => {
		if (booking.allLocations.length <= 1) {
			return booking.allLocations[0] ? String(booking.allLocations[0].id) : null;
		}
		return page.url.searchParams.get('location');
	});

	// Step 3 ("With whom?") is skipped when the service lists only one
	// employee. Gated on the service's own `employees` array so the decision
	// doesn't wait on the (separately fetched) employee roster to resolve.
	const showEmployeeStep = $derived(
		!showLocationStep && (booking.service?.employees?.length ?? 0) > 1 && !page.url.searchParams.get('employee'),
	);

	const effectiveEmployeeId = $derived.by(() => {
		const ids = booking.service?.employees ?? [];
		if (ids.length <= 1) {
			return ids[0] !== undefined ? String(ids[0]) : null;
		}
		return page.url.searchParams.get('employee');
	});

	const showTimeStep = $derived(!showLocationStep && !showEmployeeStep && !!page.url.searchParams.get('date'));
	const showMonthStep = $derived(!showLocationStep && !showEmployeeStep && !showTimeStep);

	const currentStep = $derived.by(() => {
		if (showLocationStep) return 'location';
		if (showEmployeeStep) return 'employee';
		if (showTimeStep) return 'time';
		return 'month';
	});

	// Moves focus to the (freshly re-rendered) step heading whenever the
	// rendered state changes — every branch below, including loading/error/
	// not-found, renders exactly one <h1>. `currentStep` alone isn't enough:
	// while data is still loading it's stuck on 'month' (the fallback), so an
	// effect keyed on it only would never re-fire once the real month-grid
	// heading replaces the loading text.
	$effect(() => {
		currentStep;
		booking.isLoading;
		booking.error;
		booking.service;
		document.getElementById('main-content')?.querySelector('h1')?.focus();
	});

	const locationOptions = $derived(
		booking.allLocations.map((l) => ({
			id: String(l.id),
			primary: l.name,
			secondary: [l.address1, l.city].filter(Boolean).join(', ') || null,
		})),
	);

	const employeeOptions = $derived(booking.serviceEmployees.map((e) => ({ id: String(e.id), primary: e.name })));

	const monthLabel = $derived(
		new Date(effectiveMonth + '-01T00:00').toLocaleDateString(getLocale(), { month: 'long', year: 'numeric' }),
	);

	const monthDays = $derived.by(() => {
		const [year, month] = effectiveMonth.split('-').map(Number);
		const daysInMonth = new Date(year, month, 0).getDate();
		const firstWeekday = (new Date(year, month - 1, 1).getDay() + 6) % 7; // Mon=0..Sun=6
		const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
		const days = [];
		for (let i = 0; i < totalCells; i++) {
			const dayNum = i - firstWeekday + 1;
			const cellDate = new Date(year, month - 1, dayNum);
			const dateStr = DateUtils.toLocalDate(cellDate);
			days.push({
				date: dateStr,
				dayOfMonth: cellDate.getDate(),
				inMonth: dayNum >= 1 && dayNum <= daysInMonth,
				available: booking.daysWithSlots.has(dateStr),
				isPast: dateStr < todayStr,
			});
		}
		return days;
	});

	const disablePrevMonth = $derived(effectiveMonth <= currentMonthStr);
	const disableNextMonth = $derived(!booking.hasLaterMonthAvailability);

	const selectedDate = $derived(page.url.searchParams.get('date'));

	const dateLabel = $derived.by(() => {
		if (!selectedDate) return '';
		const d = new Date(selectedDate + 'T00:00');
		return `${d.getDate()}. ${d.toLocaleDateString(getLocale(), { month: 'long' })} ${d.getFullYear()}`;
	});

	function addMonthsStr(monthStr, delta) {
		const [year, month] = monthStr.split('-').map(Number);
		const d = new Date(year, month - 1 + delta, 1);
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
	}

	function targetDayLabel(dateStr) {
		if (!dateStr) return '';
		const d = new Date(dateStr + 'T00:00');
		return `${d.getDate()} ${d.toLocaleDateString(getLocale(), { month: 'long' })}`;
	}

	const slots = $derived(selectedDate ? booking.slotsForDate(selectedDate) : []);

	const breadcrumbItems = $derived.by(() => {
		const items = [];
		if (booking.service) items.push(booking.service.name);
		const loc = booking.allLocations.find((l) => String(l.id) === effectiveLocationId);
		if (loc) items.push(loc.name);
		const emp = booking.serviceEmployees.find((e) => String(e.id) === effectiveEmployeeId);
		if (emp?.name) items.push(emp.name);
		if (selectedDate) items.push(targetDayLabel(selectedDate));
		return items;
	});

	function selectLocation(option) {
		// Preserve other params (e.g. a deep-linked `date`/`month`) — this step
		// can be reached with the rest of the wizard already resolved via URL.
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- ephemeral, built fresh for this one navigation call and discarded; not shared mutable state
		const params = new URLSearchParams(page.url.searchParams);
		params.set('location', option.id);
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- query-string-only navigation on the same route; no path change to resolve
		goto(`?${params.toString()}`);
	}

	function selectEmployee(option) {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- ephemeral, built fresh for this one navigation call and discarded; not shared mutable state
		const params = new URLSearchParams(page.url.searchParams);
		params.set('employee', option.id);
		params.delete('month');
		params.delete('date');
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- query-string-only navigation on the same route; no path change to resolve
		goto(`?${params.toString()}`);
	}

	function goToMonth(monthStr) {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- ephemeral, built fresh for this one navigation call and discarded; not shared mutable state
		const params = new URLSearchParams(page.url.searchParams);
		params.set('month', monthStr);
		params.delete('date');
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- query-string-only navigation on the same route; no path change to resolve
		goto(`?${params.toString()}`);
	}

	function selectDay(dateStr) {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- ephemeral, built fresh for this one navigation call and discarded; not shared mutable state
		const params = new URLSearchParams(page.url.searchParams);
		params.set('date', dateStr);
		// Keep `month` in sync — the Prev/Next-available-day jump on step 5 can
		// cross a month boundary, and without this the month grid you land on
		// after "Back" would show the wrong month for the breadcrumb's date.
		params.set('month', dateStr.slice(0, 7));
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- query-string-only navigation on the same route; no path change to resolve
		goto(`?${params.toString()}`);
	}

	function selectSlot(slot) {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- ephemeral, built fresh for this one navigation call and discarded; not shared mutable state
		const params = new URLSearchParams();
		params.set('vacancy', String(slot.vacancyId));
		params.set('start', slot.startTime.toISOString());
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- dynamic path segment combined with a query string; resolve() covers the bare path only
		goto(`/book/${page.params.serviceId}/confirm?${params.toString()}`);
	}

	function handleBack() {
		history.back();
	}
</script>

<BookingSummary items={breadcrumbItems} />

{#if booking.isLoading && !booking.service}
	<h1 tabindex="-1" class="text-2xl font-semibold mb-6 outline-none">{m.loading()}</h1>
	<div role="status" aria-live="polite"><p>{m.loading()}</p></div>
{:else if booking.error}
	<h1 tabindex="-1" class="text-2xl font-semibold mb-6 outline-none">{m.somethingWentWrong()}</h1>
	<div role="alert" aria-live="assertive">
		<p class="text-red-600">{apiErrorMessage(booking.error, m.errorLoadAvailability())}</p>
	</div>
{:else if !booking.service}
	<h1 tabindex="-1" class="text-2xl font-semibold mb-6 outline-none">{m.serviceNotFound()}</h1>
	<p class="text-red-600">{m.serviceNotFoundMessage()}</p>
	<a href={resolve('/')} class="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline">
		{m.backToServices()}
	</a>
{:else}
	<button
		type="button"
		onclick={handleBack}
		class="text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline mb-4"
	>
		{m.back()}
	</button>

	{#if showLocationStep}
		<h1 tabindex="-1" class="text-2xl font-semibold mb-6 outline-none">{m.where()}</h1>
		<ChoiceList options={locationOptions} onselect={selectLocation} emptyMessage={m.noLocationsAvailable()} />
	{:else if showEmployeeStep}
		<h1 tabindex="-1" class="text-2xl font-semibold mb-6 outline-none">{m.withWhom()}</h1>
		<ChoiceList options={employeeOptions} onselect={selectEmployee} emptyMessage={m.noOneAvailable()} />
	{:else if showMonthStep}
		{#if booking.isLoading}
			<h1 tabindex="-1" class="text-2xl font-semibold mb-6 outline-none">{monthLabel}</h1>
			<div role="status" aria-live="polite"><p>{m.loadingAvailability()}</p></div>
		{:else if booking.daysWithSlots.size === 0}
			<h1 tabindex="-1" class="text-2xl font-semibold mb-6 outline-none">{m.noDatesAvailable()}</h1>
			<p class="text-gray-600">{m.noDatesMessage()}</p>
		{:else}
			<div class="flex items-center justify-between mb-6">
				<button
					type="button"
					disabled={disablePrevMonth}
					onclick={() => goToMonth(addMonthsStr(effectiveMonth, -1))}
					aria-label={m.previousMonth()}
					class="px-3 py-2 text-sm font-medium bg-transparent border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					‹
				</button>
				<h1 tabindex="-1" class="text-2xl font-semibold outline-none">{monthLabel}</h1>
				<button
					type="button"
					disabled={disableNextMonth}
					onclick={() => goToMonth(addMonthsStr(effectiveMonth, 1))}
					aria-label={m.nextMonth()}
					class="px-3 py-2 text-sm font-medium bg-transparent border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					›
				</button>
			</div>
			<MonthPicker days={monthDays} onSelectDay={selectDay} />
		{/if}
	{:else if showTimeStep}
		<div class="flex items-center justify-between mb-6">
			<button
				type="button"
				disabled={!booking.previousAvailableDate}
				onclick={() => selectDay(booking.previousAvailableDate)}
				title={booking.previousAvailableDate
					? m.previousAvailable({ date: targetDayLabel(booking.previousAvailableDate) })
					: undefined}
				aria-label={booking.previousAvailableDate
					? m.previousAvailable({ date: targetDayLabel(booking.previousAvailableDate) })
					: m.previousAvailableNone()}
				class="px-3 py-2 text-sm font-medium bg-transparent border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				‹
			</button>
			<h1 tabindex="-1" class="text-2xl font-semibold outline-none">{dateLabel}</h1>
			<button
				type="button"
				disabled={!booking.nextAvailableDate}
				onclick={() => selectDay(booking.nextAvailableDate)}
				title={booking.nextAvailableDate
					? m.nextAvailable({ date: targetDayLabel(booking.nextAvailableDate) })
					: undefined}
				aria-label={booking.nextAvailableDate
					? m.nextAvailable({ date: targetDayLabel(booking.nextAvailableDate) })
					: m.nextAvailableNone()}
				class="px-3 py-2 text-sm font-medium bg-transparent border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				›
			</button>
		</div>
		<TimeSlotList {slots} onSelectSlot={selectSlot} />
	{/if}
{/if}
