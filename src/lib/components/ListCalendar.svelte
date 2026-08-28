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
	<div class="flex items-center justify-between gap-2">
		<span>{info.event.title}</span>
		<!-- Overflow menu trigger; the menu itself (Move, …) is wired up later. -->
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
