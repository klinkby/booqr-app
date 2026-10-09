<script>
	import { Calendar, Interaction, TimeGrid } from '@event-calendar/core';
	import './calendar.css';
	import { m } from '#lib/paraglide/messages.js';
	import { buttonSecondary, calendarTheme } from '#lib/ui.js';
	import { getLocale } from '#lib/paraglide/runtime.js';

	let {
		events = [],
		onDatesChange = undefined,
		onDateClick = undefined,
		onEventClick = undefined,
		onEventResize = undefined,
		onEventDrop = undefined,
	} = $props();

	let cal;
	let slotMaxTime = $state('18:00:00');

	// Read once at init: switching language reloads the SPA (see AGENTS.md), so
	// the locale never changes within a component instance's lifetime.
	const locale = getLocale();
	// Danish uses 24-hour time; English uses 12-hour.
	const hour12 = locale !== 'da';

	// Below Tailwind's `sm` breakpoint (640px) the week grid is unreadable, so show a
	// single day and swap the week-based button labels for day-based ones.
	const narrowQuery = window.matchMedia('(max-width: 639.98px)');
	// Phones get a single day; a 7-column week is unreadable below `sm`.
	const viewFor = (narrow) => (narrow ? 'timeGridDay' : 'timeGridWeek');
	const buttonTextFor = (narrow) => ({
		prev: narrow ? m.previous() : m.calendarPreviousWeek(),
		next: narrow ? m.next() : m.calendarNextWeek(),
		today: m.calendarToday(),
	});

	$effect(() => {
		if (cal) cal.setOption('events', events);
	});

	$effect(() => {
		const onChange = (e) => {
			if (!cal) return;
			cal.setOption('view', viewFor(e.matches));
			cal.setOption('buttonText', buttonTextFor(e.matches));
		};
		narrowQuery.addEventListener('change', onChange);
		return () => narrowQuery.removeEventListener('change', onChange);
	});

	$effect(() => {
		if (cal) cal.setOption('slotMaxTime', slotMaxTime);
	});

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
		view: viewFor(narrowQuery.matches),
		theme: calendarTheme,
		firstDay: 1,
		allDaySlot: false,
		slotMinTime: '06:00:00',
		slotMaxTime: '18:00:00',
		// Localizes day headers and the title; 24h vs 12h drives the axis hour
		// labels (slotLabelFormat) and event times (eventTimeFormat).
		locale,
		slotLabelFormat: { hour: '2-digit', minute: '2-digit', hour12 },
		eventTimeFormat: { hour: '2-digit', minute: '2-digit', hour12 },
		headerToolbar: {
			start: 'prev,next today',
			center: 'title',
			end: '',
		},
		buttonText: buttonTextFor(narrowQuery.matches),
		datesSet: (info) => onDatesChange?.(info),
		dateClick: (info) => onDateClick?.(info),
		eventClick: (info) => onEventClick?.(info),
		eventResize: (info) => onEventResize?.(info),
		eventDrop: (info) => onEventDrop?.(info),
	};
</script>

<svelte:window onkeydown={handleKeydown} />

<Calendar bind:this={cal} {options} plugins={[TimeGrid, Interaction]} />

{#if slotMaxTime !== '24:00:00'}
	<div class="mt-4 flex justify-end">
		<button type="button" onclick={expandCalendar} class={buttonSecondary}>
			{m.calendarExtendHours()}
		</button>
	</div>
{/if}
