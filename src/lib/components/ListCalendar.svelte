<script>
	import { Calendar, List } from '@event-calendar/core';
	import '@event-calendar/core/index.css';
	import { m } from '$lib/paraglide/messages.js';

	let { events = [], onEventClick = undefined, onDatesChange = undefined } = $props();

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
			end: '',
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

<Calendar bind:this={cal} {options} plugins={[List]} />
