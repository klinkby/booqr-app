<script>
	import {Calendar, Interaction, TimeGrid} from '@event-calendar/core';
	import '@event-calendar/core/index.css';
	import {VacancyService} from '$lib/api';
	import {invokeApi} from '$lib/invokeApi';

	let {
		locations = [],
		employees = [],
		previewEvent = null,
		ondateclick = undefined,
		oneventclick = undefined,
		oneventresize = undefined,
		oneventdrop = undefined
	} = $props();

	let cal;

	// Calendar view settings
	let slotMaxTime = $state('18:00:00');
	let currentDateRange = $state({start: null, end: null});

	// Vacancy events fetched from API
	let vacancyEvents = $state([]);
	let error = $state(null);

	// Combine vacancy events with optional preview event
	const events = $derived(previewEvent ? [...vacancyEvents, previewEvent] : vacancyEvents);

	// Update calendar events reactively without recreating full options (prevents double-fetch)
	$effect(() => {
		if (cal) {
			cal.setOption('events', events);
		}
	});

	// Update slotMaxTime reactively
	$effect(() => {
		if (cal && slotMaxTime) {
			cal.setOption('slotMaxTime', slotMaxTime);
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

	function utcToLocalIso(utcString) {
		const d = new Date(utcString);
		return `${toLocalDate(d)}T${toLocalTime(d)}`;
	}

	function transformVacancyToEvent(vacancy) {
		return {
			id: vacancy.id,
			start: utcToLocalIso(vacancy.startTime),
			end: utcToLocalIso(vacancy.endTime),
			title: vacancy.bookingId
				? 'Booked'
				: [
						employees.find(e => e.id === vacancy.employeeId)?.name,
						locations.find(l => l.id === vacancy.locationId)?.name
					].filter(Boolean).join(' @ ') || 'Available',
			startEditable: false,
			durationEditable: false,
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

	async function fetchVacancies(startDate, endDate) {
		error = null;
		try {
			const response = await invokeApi(() =>
				VacancyService.getVacancies(startDate.toISOString(), endDate.toISOString(), 0, 100)
			);
			vacancyEvents = response.items.map(transformVacancyToEvent);
		} catch (err) {
			error = err.message || 'Failed to load vacancies';
		}
	}

	function handleDatesChange(info) {
		currentDateRange = {start: info.start, end: info.end};
		fetchVacancies(info.start, info.end);
	}

	export function refresh() {
		if (currentDateRange.start && currentDateRange.end) {
			fetchVacancies(currentDateRange.start, currentDateRange.end);
		}
	}

	function expandCalendar() {
		const currentHour = parseInt(slotMaxTime.split(':')[0]);
		const newHour = currentHour + 6;
		if (newHour < 24) {
			slotMaxTime = `${newHour.toString().padStart(2, '0')}:00:00`;
		} else if (currentHour < 24) {
			slotMaxTime = '24:00:00';
		}
	}

	function handleKeydown(e) {
		if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
		if (e.ctrlKey || e.metaKey || e.altKey) return;
		const key = e.key.toLowerCase();
		if (key === 'p') cal?.prev();
		if (key === 'n') cal?.next();
		if (key === 't') cal?.setOption('date', new Date());
	}

	const options = {
		view: 'timeGridWeek',
		events: [],
		firstDay: 1,
		allDaySlot: false,
		slotMinTime: '06:00:00',
		slotMaxTime: '18:00:00',
		headerToolbar: {
			start: 'prev,next today',
			center: 'title',
			end: ''
		},
		buttonText: {
			today: 'Today'
		},
		datesSet: handleDatesChange,
		dateClick: ondateclick,
		eventClick: oneventclick,
		eventResize: oneventresize,
		eventDrop: oneventdrop
	};
</script>

<svelte:window onkeydown={handleKeydown}/>

{#if error}
	<div role="alert" aria-live="assertive" class="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-md">
		{error}
	</div>
{/if}

<div class="flex justify-end mb-2">
	{#if slotMaxTime !== '24:00:00'}
		<button
			onclick={expandCalendar}
			class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
		>
			Extend Hours (+6h)
		</button>
	{/if}
</div>

<Calendar bind:this={cal} {options} plugins={[TimeGrid, Interaction]}/>
