<script>
	import { Calendar, List } from '@event-calendar/core';
	import '@event-calendar/core/index.css';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime.js';

	let {
		events = [],
		onEventClick = undefined,
		onDatesChange = undefined,
		onBookNew = undefined,
		onMoveEvent = undefined,
	} = $props();

	let cal;

	$effect(() => {
		if (cal) cal.setOption('events', events);
	});

	// Read once at init: switching language reloads the SPA (see AGENTS.md), so
	// the locale never changes within a component instance's lifetime.
	const locale = getLocale();
	// Danish (and the rest of the app's date formatting) uses 24-hour time;
	// English uses 12-hour. Drive it explicitly off the locale rather than
	// relying on the library's per-locale default.
	const hour12 = locale !== 'da';

	const options = {
		// listYear lists every booking across the whole year in one scrolling
		// list (so all months with bookings show at once). Prev/next/today are
		// kept so bookings in an adjacent year (e.g. early January viewed from
		// December) stay reachable — they page by year in this view.
		view: 'listYear',
		firstDay: 1,
		// Localizes day/month names in the list day headers and the title.
		locale,
		// Event time (the timeText shown in each row) honours the locale's clock.
		eventTimeFormat: { hour: '2-digit', minute: '2-digit', hour12 },
		headerToolbar: {
			start: 'prev,next today',
			center: 'title',
			end: 'bookNew',
		},
		customButtons: {
			bookNew: {
				text: m.bookNewAppointment(),
				click: () => onBookNew?.(),
			},
		},
		buttonText: {
			prev: m.calendarPreviousYear(),
			next: m.calendarNextYear(),
			today: m.calendarToday(),
		},
		datesSet: (info) => onDatesChange?.(info),
		eventClick: (info) => onEventClick?.(info),
		// Localized empty state (the library's own default is untranslated).
		noEventsContent: () => m.noBookings(),
	};
</script>

<div class="list-calendar">
	<Calendar bind:this={cal} {options} plugins={[List]} {eventContent} />
</div>

{#snippet eventContent(info)}
	<!-- A custom eventContent snippet replaces the library's default
	     time+title rendering, so both are recreated here (reusing the
	     library's ec-event-time / ec-event-title classes for consistent
	     styling), plus the trailing overflow-menu trigger. -->
	<div class="flex flex-1 items-center justify-between gap-2">
		<span class="flex flex-wrap items-baseline gap-x-2">
			{#if info.timeText}<time class="ec-event-time">{info.timeText}</time>{/if}
			<span class="ec-event-title">{info.event.title}</span>
		</span>
		<!-- Overflow menu trigger; the menu itself (Move, …) is wired up later.
		     justify-between pushes it to the row's right padding edge, aligning
		     it with the date shown in the day header above. -->
		<button
			type="button"
			aria-label={m.bookingActions()}
			aria-haspopup="menu"
			onclick={(e) => {
				e.stopPropagation();
				onMoveEvent?.(info.event);
			}}
			class="shrink-0 px-2 py-0.5 text-lg leading-none text-gray-500 bg-transparent rounded hover:bg-gray-100"
		>
			⋮
		</button>
	</div>
{/snippet}

<style>
	/* Color the "Book a new appointment" custom toolbar button as the app's
	   primary call-to-action (indigo-600), matching Form/PasswordReset submit
	   buttons. Scoped to this component's calendar so the admin weekly Calendar
	   is unaffected; :global reaches the child <Calendar>'s generated markup. */
	.list-calendar :global(.ec-button.ec-bookNew) {
		background-color: #4f46e5; /* indigo-600 */
		border-color: #4f46e5;
		color: #fff;
	}
	.list-calendar :global(.ec-button.ec-bookNew:hover) {
		background-color: #4338ca; /* indigo-700 */
		border-color: #4338ca;
	}
</style>
