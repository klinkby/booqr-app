<script>
	import { Calendar, List } from '@event-calendar/core';
	import '@event-calendar/core/index.css';
	import { m } from '$lib/paraglide/messages.js';

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

	const options = {
		view: 'listMonth',
		firstDay: 1,
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
			prev: m.calendarPreviousWeek(),
			next: m.calendarNextWeek(),
			today: m.calendarToday(),
		},
		datesSet: (info) => onDatesChange?.(info),
		eventClick: (info) => onEventClick?.(info),
	};
</script>

<Calendar bind:this={cal} {options} plugins={[List]} {eventContent} />

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
